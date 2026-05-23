/**
 * Middleware: authentication & authorization.
 */

exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) return next();
    res.redirect('/login');
};

exports.isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.redirect('/admin/login');
};

exports.attachLocals = (req, res, next) => {
    res.locals.user      = req.session.user || null;
    res.locals.cartCount = (req.session.cart || []).reduce((s, i) => s + i.quantity, 0);
    next();
};
