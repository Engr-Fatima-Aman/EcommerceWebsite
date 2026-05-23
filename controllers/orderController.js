/**
 * ORDER CONTROLLER (MVC)
 *
 * Combines MULTIPLE patterns:
 *   • Factory   → PaymentProcessor based on chosen method
 *   • Strategy  → discount strategy from coupon code
 *   • Observer  → email / SMS / admin / inventory / PostEx courier
 *   • Repository→ all SQL hidden in repository classes
 *   • Singleton → ConfigManager for tax & shipping
 *   • Decorator → applied at cart level
 *
 * Payment flow split:
 *   - cod      → order placed + PostEx auto-booked + customer gets tracking
 *   - bank/jc  → order placed, customer redirected to upload-proof page
 *   - express  → (future) XPay redirect
 */

const ConfigManager     = require('../patterns/singleton/ConfigManager');
const Logger            = require('../patterns/singleton/Logger');
const OrderRepository   = require('../patterns/repository/OrderRepository');
const { PaymentFactory } = require('../patterns/factory/PaymentFactory');
const { getStrategyForCoupon, DiscountContext } = require('../patterns/strategy/DiscountStrategy');
const {
    OrderSubject, EmailNotifier, SMSNotifier,
    AdminDashboardNotifier, InventoryUpdater, PostExCourierBooker
} = require('../patterns/observer/OrderObservers');
const { buildCartItems } = require('./cartController');

const orderRepo = new OrderRepository();
const config    = ConfigManager.getInstance();
const logger    = Logger.getInstance();

// ============================================================
// Helpers
// ============================================================
function computeTotals(items, coupon) {
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    let discountInfo = { discount: 0, finalTotal: subtotal, applied: 'None' };
    if (coupon) {
        const strategy = getStrategyForCoupon(coupon);
        if (strategy) {
            discountInfo = new DiscountContext(strategy).calculate(
                subtotal,
                items.map(i => ({ price: i.unitPrice, quantity: i.quantity }))
            );
        }
    }
    const shipping = subtotal >= config.get('freeShippingAbove') ? 0 : config.get('shippingFee');
    const tax      = Math.round(discountInfo.finalTotal * config.get('taxRate'));
    const total    = discountInfo.finalTotal + shipping + tax;
    return { subtotal, discountInfo, shipping, tax, total };
}

function paymentInstructionsHtml(method, order) {
    const bankName    = process.env.BANK_NAME || 'Meezan Bank';
    const bankTitle   = process.env.BANK_ACCOUNT_TITLE || 'RIWAQ Jewellery';
    const bankAcc     = process.env.BANK_ACCOUNT_NUMBER || '01234567890123';
    const iban        = process.env.BANK_IBAN || 'PK00MEZN0001234567890123';
    const jcNumber    = process.env.JAZZCASH_NUMBER || '03001234567';
    const jcTitle     = process.env.JAZZCASH_ACCOUNT_TITLE || 'RIWAQ Jewellery';
    const epNumber    = process.env.EASYPAISA_NUMBER || '03001234567';
    const epTitle     = process.env.EASYPAISA_ACCOUNT_TITLE || 'RIWAQ Jewellery';

    if (method === 'bank') {
        return `
            Please transfer <strong>Rs. ${order.total.toLocaleString('en-PK')}</strong> to:<br>
            <strong>Bank:</strong> ${bankName}<br>
            <strong>Title:</strong> ${bankTitle}<br>
            <strong>Account #:</strong> ${bankAcc}<br>
            <strong>IBAN:</strong> ${iban}<br><br>
            <em>After transfer, upload the receipt at <a href="${process.env.BRAND_URL || ''}/orders/${order.id}/payment">the payment page</a> or reply with the screenshot.</em>`;
    }
    if (method === 'jazzcash' || method === 'wallet') {
        return `
            Please send <strong>Rs. ${order.total.toLocaleString('en-PK')}</strong> via JazzCash or EasyPaisa:<br>
            <strong>JazzCash:</strong> ${jcNumber} (${jcTitle})<br>
            <strong>EasyPaisa:</strong> ${epNumber} (${epTitle})<br><br>
            <em>After payment, upload the screenshot on your order page.</em>`;
    }
    return null;
}

// ============================================================
// Checkout page
// ============================================================
exports.showCheckout = (req, res) => {
    const items = buildCartItems(req.session.cart || []);
    if (items.length === 0) return res.redirect('/cart');

    const { subtotal, discountInfo, shipping, tax, total } = computeTotals(items, req.session.coupon);

    res.render('customer/checkout', {
        items, subtotal, discountInfo, shipping, tax, total,
        paymentMethods: PaymentFactory.getAvailableMethods(),
        user: req.session.user,
        layout: 'layouts/customer',
        pageTitle: 'Checkout'
    });
};

// ============================================================
// Place order (async — observers may do async I/O)
// ============================================================
exports.placeOrder = async (req, res) => {
    try {
        const items = buildCartItems(req.session.cart || []);
        if (items.length === 0) return res.redirect('/cart');

        const { address, city, phone, payment_method, notes } = req.body;
        if (!address || !city || !phone || !payment_method) {
            return res.redirect('/checkout');
        }

        // ----- 1. Compute totals -----
        const { subtotal, discountInfo, shipping, tax, total } = computeTotals(items, req.session.coupon);

        // ----- 2. Payment Factory (validates method exists) -----
        const processor = PaymentFactory.create(payment_method, { total });
        const paymentResult = processor.process();
        logger.info(`Payment processor invoked: ${paymentResult.method} → ${paymentResult.transactionId || 'pending'}`);

        // For COD: payment_status='cod-pending'. For others: 'pending' (until proof uploaded)
        const initialPaymentStatus = payment_method === 'cod' ? 'cod-pending' : 'pending';

        // ----- 3. Insert order via Repository -----
        const orderId = orderRepo.create({
            user_id:         req.session.user.id,
            subtotal,
            discount:        discountInfo.discount,
            shipping,
            tax,
            total,
            status:          'Placed',
            payment_method:  paymentResult.method,
            payment_status:  initialPaymentStatus,
            coupon:          req.session.coupon || null,
            address, city, phone,
            notes:           notes || null
        });

        // ----- 4. Add items (stock decremented by InventoryUpdater observer) -----
        for (const i of items) {
            orderRepo.addItem(orderId, {
                product_id: i.product.id,
                quantity:   i.quantity,
                price:      i.unitPrice,
                customizations: JSON.stringify(i.customizations)
            });
        }

        // ----- 5. Build the full order object for observers -----
        const orderRecord = orderRepo.findById(orderId);
        const paymentInstructions = paymentInstructionsHtml(payment_method, orderRecord);

        // ----- 6. Observer Pattern: notify everyone -----
        const subject = new OrderSubject();
        subject.attach(new EmailNotifier());
        subject.attach(new SMSNotifier());
        subject.attach(new AdminDashboardNotifier());
        subject.attach(new InventoryUpdater());
        subject.attach(new PostExCourierBooker());

        let courierTracking = null;
        const notifications = await subject.notify({
            event:           'order_placed',
            orderId,
            order:           orderRecord,
            status:          'Placed',
            paymentMethod:   payment_method,
            paymentResult,
            paymentInstructions,
            items:           items.map(i => ({
                                product_id: i.product.id,
                                name: i.product.name,
                                price: i.unitPrice,
                                quantity: i.quantity
                            })),
            customerEmail:   req.session.user.email,
            customerName:    req.session.user.name,
            customerPhone:   phone,
            address, city,
            onTrackingNumber: (tn) => { courierTracking = tn; }
        });

        // ----- 7. Persist tracking number if PostEx booked -----
        if (courierTracking) {
            orderRepo.updateTrackingNumber(orderId, courierTracking);
        }

        // ----- 8. Clear cart + coupon -----
        req.session.cart = [];
        req.session.coupon = null;

        // ----- 9. For non-COD: redirect to payment-pending. For COD: confirmation. -----
        if (payment_method !== 'cod') {
            return res.redirect(`/orders/${orderId}/payment`);
        }

        res.render('customer/order-confirmation', {
            orderId,
            paymentResult,
            paymentInstructions,
            notifications,
            total,
            trackingNumber: courierTracking,
            layout: 'layouts/customer',
            pageTitle: 'Order Confirmed'
        });
    } catch (err) {
        logger.error(`Order placement failed: ${err.message}\n${err.stack}`);
        res.status(500).send('Sorry, something went wrong placing your order. Please try again.');
    }
};

// ============================================================
// Payment proof upload page (for bank/jazzcash/easypaisa)
// ============================================================
exports.showPaymentPage = (req, res) => {
    const order = orderRepo.findById(req.params.id);
    if (!order || order.user_id !== req.session.user.id) {
        return res.status(404).render('customer/404', { layout: 'layouts/customer' });
    }
    res.render('customer/payment-pending', {
        order,
        paymentDetails: {
            bank: {
                name:    process.env.BANK_NAME,
                title:   process.env.BANK_ACCOUNT_TITLE,
                account: process.env.BANK_ACCOUNT_NUMBER,
                iban:    process.env.BANK_IBAN
            },
            jazzcash: {
                number: process.env.JAZZCASH_NUMBER,
                title:  process.env.JAZZCASH_ACCOUNT_TITLE
            },
            easypaisa: {
                number: process.env.EASYPAISA_NUMBER,
                title:  process.env.EASYPAISA_ACCOUNT_TITLE
            }
        },
        layout: 'layouts/customer',
        pageTitle: 'Complete Payment'
    });
};

// ============================================================
// Upload payment proof (multer middleware attached in route)
// ============================================================
exports.uploadPaymentProof = (req, res) => {
    const order = orderRepo.findById(req.params.id);
    if (!order || order.user_id !== req.session.user.id) {
        return res.status(404).render('customer/404', { layout: 'layouts/customer' });
    }
    if (!req.file) {
        return res.redirect(`/orders/${order.id}/payment?error=no-file`);
    }
    const publicPath = '/uploads/' + req.file.filename;
    orderRepo.updatePaymentProof(order.id, publicPath);
    logger.info(`Payment proof uploaded for order #${order.id} → ${publicPath}`);
    res.redirect(`/orders/${order.id}?payment=submitted`);
};

// ============================================================
// Order history
// ============================================================
exports.history = (req, res) => {
    const orders = orderRepo.findByUser(req.session.user.id);
    res.render('customer/orders', {
        orders,
        layout: 'layouts/customer',
        pageTitle: 'My Orders'
    });
};

// ============================================================
// Order detail
// ============================================================
exports.viewOrder = (req, res) => {
    const order = orderRepo.findById(req.params.id);
    if (!order || order.user_id !== req.session.user.id) {
        return res.status(404).render('customer/404', { layout: 'layouts/customer' });
    }
    const items = orderRepo.findItems(order.id);
    res.render('customer/order-detail', {
        order, items,
        flash: req.query.payment === 'submitted' ? 'Payment proof submitted — we\'ll verify and email you shortly.' : null,
        layout: 'layouts/customer',
        pageTitle: `Order #${order.id}`
    });
};
