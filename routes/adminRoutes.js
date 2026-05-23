const express = require('express');
const router  = express.Router();

const authCtrl  = require('../controllers/authController');
const adminCtrl = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// Admin auth (public)
router.get('/login',           authCtrl.showAdminLogin);
router.post('/login',          authCtrl.adminLogin);

// Everything below requires admin
router.use(isAdmin);

router.get('/',                          (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard',                 adminCtrl.dashboard);

router.get('/products',                  adminCtrl.listProducts);
router.get('/products/add',              adminCtrl.showAddProduct);
router.post('/products/add',             adminCtrl.createProduct);
router.get('/products/edit/:id',         adminCtrl.showEditProduct);
router.post('/products/edit/:id',        adminCtrl.updateProduct);
router.get('/products/delete/:id',       adminCtrl.deleteProduct);

router.get('/orders',                    adminCtrl.listOrders);
router.get('/orders/:id',                adminCtrl.viewOrder);
router.post('/orders/:id/status',        adminCtrl.updateOrderStatus);
router.post('/orders/:id/verify-payment', adminCtrl.verifyPayment);

router.get('/payments',                  adminCtrl.listPendingPayments);

router.get('/customers',                 adminCtrl.listCustomers);
router.get('/patterns',                  adminCtrl.patternsInfo);

module.exports = router;
