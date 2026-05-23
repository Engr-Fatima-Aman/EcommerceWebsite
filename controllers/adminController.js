/**
 * ADMIN CONTROLLER (MVC)
 *
 * Handles everything inside /admin/* — dashboard analytics,
 * product CRUD, order management (status changes trigger the
 * Observer pattern again), and customer listing.
 */

const ProductRepository  = require('../patterns/repository/ProductRepository');
const OrderRepository    = require('../patterns/repository/OrderRepository');
const UserRepository     = require('../patterns/repository/UserRepository');
const CategoryRepository = require('../patterns/repository/CategoryRepository');
const Logger             = require('../patterns/singleton/Logger');
const {
    OrderSubject, EmailNotifier, SMSNotifier,
    AdminDashboardNotifier, InventoryUpdater
} = require('../patterns/observer/OrderObservers');

const productRepo  = new ProductRepository();
const orderRepo    = new OrderRepository();
const userRepo     = new UserRepository();
const categoryRepo = new CategoryRepository();
const logger       = Logger.getInstance();

// ===== Dashboard =====
exports.dashboard = (req, res) => {
    const orderStats = orderRepo.getStats();
    const stats = {
        totalProducts:  productRepo.count(),
        totalCustomers: userRepo.countCustomers(),
        totalOrders:    orderStats.total,
        revenue:        orderStats.revenue,
        ...orderStats
    };
    const recentOrders = orderRepo.findAllWithUser().slice(0, 5);
    const lowStock     = productRepo.findAll().filter(p => p.stock < 5).slice(0, 5);

    res.render('admin/dashboard', {
        stats, recentOrders, lowStock,
        layout: 'layouts/admin',
        active: 'dashboard',
        pageTitle: 'Dashboard'
    });
};

// ===== Products =====
exports.listProducts = (req, res) => {
    const products = productRepo.findAll();
    res.render('admin/products', {
        products,
        layout: 'layouts/admin',
        active: 'products',
        pageTitle: 'Products'
    });
};

exports.showAddProduct = (req, res) => {
    res.render('admin/product-form', {
        product: null,
        categories: categoryRepo.findAll(),
        layout: 'layouts/admin',
        active: 'products',
        pageTitle: 'Add Product'
    });
};

exports.createProduct = (req, res) => {
    // If admin uploaded an image, use that path; else fall back to typed path
    let imagePath = req.body.image || '/img/products/ring-1.svg';
    if (req.file) imagePath = '/uploads/products/' + req.file.filename;

    const data = {
        name:        req.body.name,
        description: req.body.description,
        price:       parseFloat(req.body.price),
        category_id: parseInt(req.body.category_id, 10),
        type:        req.body.type,
        material:    req.body.material,
        occasion:    req.body.occasion,
        size:        req.body.size || null,
        length:      req.body.length || null,
        stock:       parseInt(req.body.stock, 10) || 0,
        image:       imagePath,
        featured:    req.body.featured === 'on' ? 1 : 0
    };
    productRepo.create(data);
    logger.info(`Admin created product: ${data.name} (image: ${imagePath})`);
    res.redirect('/admin/products');
};

exports.showEditProduct = (req, res) => {
    const product = productRepo.findById(req.params.id);
    if (!product) return res.redirect('/admin/products');
    res.render('admin/product-form', {
        product,
        categories: categoryRepo.findAll(),
        layout: 'layouts/admin',
        active: 'products',
        pageTitle: 'Edit Product'
    });
};

exports.updateProduct = (req, res) => {
    // If admin uploaded a new image, replace; else keep existing path from form
    let imagePath = req.body.image;
    if (req.file) imagePath = '/uploads/products/' + req.file.filename;

    const data = {
        name:        req.body.name,
        description: req.body.description,
        price:       parseFloat(req.body.price),
        category_id: parseInt(req.body.category_id, 10),
        type:        req.body.type,
        material:    req.body.material,
        occasion:    req.body.occasion,
        size:        req.body.size || null,
        length:      req.body.length || null,
        stock:       parseInt(req.body.stock, 10) || 0,
        image:       imagePath,
        featured:    req.body.featured === 'on' ? 1 : 0
    };
    productRepo.update(req.params.id, data);
    res.redirect('/admin/products');
};

exports.deleteProduct = (req, res) => {
    productRepo.delete(req.params.id);
    res.redirect('/admin/products');
};

// ===== Orders =====
exports.listOrders = (req, res) => {
    const orders = orderRepo.findAllWithUser();
    res.render('admin/orders', {
        orders,
        layout: 'layouts/admin',
        active: 'orders',
        pageTitle: 'Orders'
    });
};

exports.viewOrder = (req, res) => {
    const order = orderRepo.findById(req.params.id);
    if (!order) return res.redirect('/admin/orders');
    const items    = orderRepo.findItems(order.id);
    const customer = userRepo.findById(order.user_id);
    res.render('admin/order-detail', {
        order, items, customer,
        layout: 'layouts/admin',
        active: 'orders',
        pageTitle: `Order #${order.id}`
    });
};

// Updating order status → Observer Pattern fires
exports.updateOrderStatus = async (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    const newStatus = req.body.status;
    const order    = orderRepo.findById(orderId);
    if (!order)    return res.redirect('/admin/orders');
    const customer = userRepo.findById(order.user_id);

    orderRepo.updateStatus(orderId, newStatus);
    logger.info(`Admin changed order #${orderId} status → ${newStatus}`);

    // ----- Fire Observer Pattern again -----
    const subject = new OrderSubject();
    subject.attach(new EmailNotifier());
    subject.attach(new SMSNotifier());
    subject.attach(new AdminDashboardNotifier());
    subject.attach(new InventoryUpdater());

    await subject.notify({
        event:         'status_update',
        orderId,
        order:         { ...order, status: newStatus },
        status:        newStatus,
        customerEmail: customer ? customer.email : null,
        customerName:  customer ? customer.name : null,
        customerPhone: order.phone,
        trackingNumber: order.tracking_number,
        items:         orderRepo.findItems(orderId).map(i => ({
                            product_id: i.product_id,
                            quantity: i.quantity
                        }))
    });

    res.redirect('/admin/orders/' + orderId);
};

// ===== Payment verification (for bank/jazzcash orders) =====
exports.listPendingPayments = (req, res) => {
    const pending = orderRepo.findPending();
    res.render('admin/payments', {
        orders: pending,
        layout: 'layouts/admin',
        active: 'payments',
        pageTitle: 'Verify Payments'
    });
};

exports.verifyPayment = async (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    const action  = req.body.action; // 'approve' | 'reject'
    const order   = orderRepo.findById(orderId);
    if (!order) return res.redirect('/admin/orders');
    const customer = userRepo.findById(order.user_id);

    if (action === 'approve') {
        orderRepo.updatePaymentStatus(orderId, 'verified');
        orderRepo.updateStatus(orderId, 'Processing');
        logger.info(`Admin VERIFIED payment for order #${orderId}`);

        // For verified non-COD orders → book PostEx now
        const { PostExCourierBooker } = require('../patterns/observer/OrderObservers');
        const subject = new OrderSubject();
        subject.attach(new EmailNotifier());
        // Manually book courier (PostExCourierBooker only fires on 'order_placed' for COD)
        const PostEx = require('../lib/postex');
        const courier = await PostEx.getInstance().createOrder({
            customerName:    customer ? customer.name : 'Customer',
            customerPhone:   order.phone,
            deliveryAddress: order.address,
            deliveryCity:    order.city,
            invoicePayment:  0,  // prepaid — PostEx will know it's not COD
            orderRefNumber:  orderId,
            orderDetail:     `RIWAQ jewellery (prepaid)`,
            items:           orderRepo.findItems(orderId).length
        });
        if (courier.success) {
            orderRepo.updateTrackingNumber(orderId, courier.trackingNumber);
            logger.info(`PostEx booked for prepaid order #${orderId} → ${courier.trackingNumber}`);
        }

        // Email customer
        await subject.notify({
            event:         'payment_verified',
            orderId,
            order:         { ...order, status: 'Processing' },
            status:        'Processing',
            customerEmail: customer ? customer.email : null,
            customerName:  customer ? customer.name : null,
            trackingNumber: courier.trackingNumber || null
        });
    } else if (action === 'reject') {
        orderRepo.updatePaymentStatus(orderId, 'rejected');
        logger.info(`Admin REJECTED payment for order #${orderId}`);
    }

    res.redirect('/admin/orders/' + orderId);
};

// ===== Customers =====
exports.listCustomers = (req, res) => {
    const customers = userRepo.findAllCustomers();
    res.render('admin/customers', {
        customers,
        layout: 'layouts/admin',
        active: 'customers',
        pageTitle: 'Customers'
    });
};

// ===== Patterns Documentation Page =====
exports.patternsInfo = (req, res) => {
    res.render('admin/patterns', {
        layout: 'layouts/admin',
        active: 'patterns',
        pageTitle: 'Design Patterns'
    });
};
