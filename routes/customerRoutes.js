const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const authCtrl     = require('../controllers/authController');
const productCtrl  = require('../controllers/productController');
const cartCtrl     = require('../controllers/cartController');
const wishlistCtrl = require('../controllers/wishlistController');
const orderCtrl    = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/auth');

// ----- File upload setup (payment proof screenshots) -----
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-z0-9.\-]/gi, '_').toLowerCase();
        cb(null, `proof-${req.params.id}-${Date.now()}-${safe}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (/^image\//.test(file.mimetype) || file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only images or PDF allowed'));
    }
});

// Public pages
router.get('/',                productCtrl.home);
router.get('/shop',            productCtrl.shop);
router.get('/product/:id',     productCtrl.detail);

// Auth
router.get('/login',           authCtrl.showLogin);
router.post('/login',          authCtrl.login);
router.get('/register',        authCtrl.showRegister);
router.post('/register',       authCtrl.register);
router.get('/logout',          authCtrl.logout);

// Cart
router.get('/cart',                  cartCtrl.viewCart);
router.post('/cart/add',             cartCtrl.addToCart);
router.post('/cart/update',          cartCtrl.updateCart);
router.get('/cart/remove/:index',    cartCtrl.removeFromCart);
router.post('/cart/coupon',          cartCtrl.applyCoupon);

// Wishlist (login required)
router.get('/wishlist',          isAuthenticated, wishlistCtrl.viewWishlist);
router.post('/wishlist/toggle',  isAuthenticated, wishlistCtrl.toggleWishlist);

// Checkout & orders (login required)
router.get('/checkout',                       isAuthenticated, orderCtrl.showCheckout);
router.post('/checkout',                      isAuthenticated, orderCtrl.placeOrder);
router.get('/orders',                         isAuthenticated, orderCtrl.history);
router.get('/orders/:id',                     isAuthenticated, orderCtrl.viewOrder);
router.get('/orders/:id/payment',             isAuthenticated, orderCtrl.showPaymentPage);
router.post('/orders/:id/payment-proof',      isAuthenticated, upload.single('proof'), orderCtrl.uploadPaymentProof);

module.exports = router;
