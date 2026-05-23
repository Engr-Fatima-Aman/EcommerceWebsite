/**
 * WISHLIST CONTROLLER (MVC)
 *
 * Uses a dedicated repository for the wishlist table.
 */

const DatabaseManager   = require('../patterns/singleton/DatabaseManager');
const ProductRepository = require('../patterns/repository/ProductRepository');
const { ProductFactory } = require('../patterns/factory/ProductFactory');

const productRepo = new ProductRepository();
const db = DatabaseManager.getInstance().getConnection();

exports.viewWishlist = (req, res) => {
    const userId = req.session.user.id;
    const rows = db.prepare(`
        SELECT p.* FROM wishlist w
        JOIN products p ON p.id = w.product_id
        WHERE w.user_id = ?
        ORDER BY w.added_at DESC
    `).all(userId);

    const items = rows.map(r => ProductFactory.create(r.type, r));
    res.render('customer/wishlist', {
        items,
        layout: 'layouts/customer',
        pageTitle: 'My Wishlist'
    });
};

exports.toggleWishlist = (req, res) => {
    const userId    = req.session.user.id;
    const productId = parseInt(req.body.product_id, 10);

    const existing = db.prepare(
        'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?'
    ).get(userId, productId);

    if (existing) {
        db.prepare('DELETE FROM wishlist WHERE id = ?').run(existing.id);
    } else {
        db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)')
          .run(userId, productId);
    }
    res.redirect(req.headers.referer || '/wishlist');
};
