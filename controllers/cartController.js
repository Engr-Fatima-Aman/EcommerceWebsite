/**
 * CART CONTROLLER (MVC)
 *
 * Cart is stored in the user's SESSION (express-session) as an
 * array of { product_id, quantity, customizations: {...} }.
 *
 * Uses the Decorator Pattern to compute customized line prices
 * (gift wrap, engraving, premium packaging, express delivery).
 */

const ProductRepository = require('../patterns/repository/ProductRepository');
const { ProductFactory }       = require('../patterns/factory/ProductFactory');
const { buildDecoratedProduct } = require('../patterns/decorator/ProductDecorator');
const { getStrategyForCoupon, DiscountContext } = require('../patterns/strategy/DiscountStrategy');
const ConfigManager = require('../patterns/singleton/ConfigManager');

const productRepo = new ProductRepository();
const config      = ConfigManager.getInstance();

// ----- Helper: load cart with computed prices -----
function buildCartItems(sessionCart) {
    if (!sessionCart || sessionCart.length === 0) return [];
    return sessionCart.map(line => {
        const raw = productRepo.findById(line.product_id);
        if (!raw) return null;
        const baseProduct = ProductFactory.create(raw.type, raw);
        const decorated   = buildDecoratedProduct(baseProduct, line.customizations || {});
        const unitPrice   = decorated.getPrice();
        return {
            product: baseProduct,
            decorated,
            quantity: line.quantity,
            customizations: line.customizations || {},
            unitPrice,
            lineTotal: unitPrice * line.quantity,
            decorations: decorated.getDetails ? decorated.getDetails() : []
        };
    }).filter(Boolean);
}

// ----- View cart -----
exports.viewCart = (req, res) => {
    const items = buildCartItems(req.session.cart || []);
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

    // Apply any saved coupon
    let discountInfo = { discount: 0, finalTotal: subtotal, applied: 'None' };
    if (req.session.coupon) {
        const strategy = getStrategyForCoupon(req.session.coupon);
        if (strategy) {
            discountInfo = new DiscountContext(strategy).calculate(subtotal, items.map(i => ({
                price: i.unitPrice, quantity: i.quantity
            })));
        }
    }

    const shipping = subtotal >= config.get('freeShippingAbove') ? 0 : config.get('shippingFee');
    const tax      = Math.round(discountInfo.finalTotal * config.get('taxRate'));
    const total    = discountInfo.finalTotal + shipping + tax;

    res.render('customer/cart', {
        items, subtotal, discountInfo, shipping, tax, total,
        coupon: req.session.coupon || '',
        layout: 'layouts/customer',
        pageTitle: 'Shopping Cart'
    });
};

// ----- Add to cart -----
exports.addToCart = (req, res) => {
    if (!req.session.cart) req.session.cart = [];

    const productId = parseInt(req.body.product_id, 10);
    const quantity  = parseInt(req.body.quantity || 1, 10);

    const customizations = {
        giftWrap:   req.body.giftWrap   || null,        // color string or null
        engraving:  req.body.engraving  || null,        // text or null
        premiumBox: req.body.premiumBox === 'on',
        express:    req.body.express    === 'on'
    };

    // Existing line with same product + same customizations? → bump qty
    const existingIdx = req.session.cart.findIndex(line =>
        line.product_id === productId &&
        JSON.stringify(line.customizations) === JSON.stringify(customizations)
    );
    if (existingIdx >= 0) {
        req.session.cart[existingIdx].quantity += quantity;
    } else {
        req.session.cart.push({ product_id: productId, quantity, customizations });
    }

    res.redirect('/cart');
};

// ----- Update quantity -----
exports.updateCart = (req, res) => {
    const { index, quantity } = req.body;
    if (req.session.cart && req.session.cart[index]) {
        const q = parseInt(quantity, 10);
        if (q <= 0) req.session.cart.splice(index, 1);
        else        req.session.cart[index].quantity = q;
    }
    res.redirect('/cart');
};

// ----- Remove item -----
exports.removeFromCart = (req, res) => {
    const { index } = req.params;
    if (req.session.cart && req.session.cart[index]) {
        req.session.cart.splice(index, 1);
    }
    res.redirect('/cart');
};

// ----- Apply coupon (Strategy Pattern) -----
exports.applyCoupon = (req, res) => {
    const code = (req.body.coupon || '').trim();
    const strategy = getStrategyForCoupon(code);
    if (strategy) {
        req.session.coupon = code;
    } else {
        req.session.coupon = null;
    }
    res.redirect('/cart');
};

// Export helper for re-use in checkout
exports.buildCartItems = buildCartItems;
