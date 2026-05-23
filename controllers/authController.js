/**
 * AUTH CONTROLLER (part of MVC)
 *
 * Handles user registration, login, logout for both
 * customer and admin roles. Uses UserRepository (Repository
 * Pattern) for data access — no SQL is written here.
 */

const bcrypt         = require('bcryptjs');
const UserRepository = require('../patterns/repository/UserRepository');
const Logger         = require('../patterns/singleton/Logger');

const userRepo = new UserRepository();
const logger   = Logger.getInstance();

// ----- Customer Register -----
exports.showRegister = (req, res) => {
    res.render('customer/register', { error: null, layout: 'layouts/customer' });
};

exports.register = async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
        return res.render('customer/register', {
            error: 'All fields are required',
            layout: 'layouts/customer'
        });
    }

    if (userRepo.findByEmail(email)) {
        return res.render('customer/register', {
            error: 'An account with this email already exists',
            layout: 'layouts/customer'
        });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = userRepo.create({
        name, email, password: hashed, role: 'customer', phone: phone || ''
    });

    req.session.user = { id: userId, name, email, role: 'customer' };
    logger.info(`New customer registered: ${email}`);

    // Fire welcome email via Observer Pattern (single observer)
    try {
        const { OrderSubject, EmailNotifier } = require('../patterns/observer/OrderObservers');
        const subject = new OrderSubject();
        subject.attach(new EmailNotifier());
        // fire-and-forget — don't block registration on email
        subject.notify({
            event: 'welcome',
            customerEmail: email,
            customerName: name
        }).catch(err => logger.error(`Welcome email failed: ${err.message}`));
    } catch (e) {
        logger.error(`Welcome email setup failed: ${e.message}`);
    }

    res.redirect('/');
};

// ----- Login (customer + admin share this) -----
exports.showLogin = (req, res) => {
    res.render('customer/login', { error: null, layout: 'layouts/customer' });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = userRepo.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render('customer/login', {
            error: 'Invalid email or password',
            layout: 'layouts/customer'
        });
    }

    req.session.user = {
        id: user.id, name: user.name, email: user.email, role: user.role
    };
    logger.info(`User logged in: ${email} (${user.role})`);

    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    res.redirect('/');
};

// ----- Admin Login (separate page, same logic) -----
exports.showAdminLogin = (req, res) => {
    res.render('admin/login', { error: null, layout: false });
};

exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    const user = userRepo.findByEmail(email);

    if (!user || user.role !== 'admin' || !(await bcrypt.compare(password, user.password))) {
        return res.render('admin/login', {
            error: 'Invalid admin credentials',
            layout: false
        });
    }

    req.session.user = {
        id: user.id, name: user.name, email: user.email, role: 'admin'
    };
    logger.info(`Admin logged in: ${email}`);
    res.redirect('/admin/dashboard');
};

// ----- Logout -----
exports.logout = (req, res) => {
    if (req.session.user) logger.info(`User logged out: ${req.session.user.email}`);
    req.session.destroy(() => res.redirect('/'));
};
