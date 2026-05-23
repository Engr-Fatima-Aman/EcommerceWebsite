const BaseRepository = require('./BaseRepository');

class OrderRepository extends BaseRepository {
    constructor() {
        super('orders');
    }

    findByUser(userId) {
        return this.db.prepare(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC'
        ).all(userId);
    }

    findAllWithUser() {
        return this.db.prepare(`
            SELECT o.*, u.name AS customer_name, u.email AS customer_email
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            ORDER BY o.id DESC
        `).all();
    }

    findItems(orderId) {
        return this.db.prepare(`
            SELECT oi.*, p.name AS product_name, p.image AS product_image
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
        `).all(orderId);
    }

    addItem(orderId, item) {
        return this.db.prepare(`
            INSERT INTO order_items (order_id, product_id, quantity, price, customizations)
            VALUES (?, ?, ?, ?, ?)
        `).run(orderId, item.product_id, item.quantity, item.price, item.customizations || '');
    }

    updateStatus(orderId, status) {
        return this.db.prepare(
            'UPDATE orders SET status = ? WHERE id = ?'
        ).run(status, orderId);
    }

    updateTrackingNumber(orderId, trackingNumber) {
        return this.db.prepare(
            'UPDATE orders SET tracking_number = ? WHERE id = ?'
        ).run(trackingNumber, orderId);
    }

    updatePaymentProof(orderId, proofPath) {
        return this.db.prepare(
            "UPDATE orders SET payment_proof = ?, payment_status = 'submitted' WHERE id = ?"
        ).run(proofPath, orderId);
    }

    updatePaymentStatus(orderId, paymentStatus) {
        return this.db.prepare(
            'UPDATE orders SET payment_status = ? WHERE id = ?'
        ).run(paymentStatus, orderId);
    }

    findPending() {
        return this.db.prepare(`
            SELECT o.*, u.name AS customer_name, u.email AS customer_email
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            WHERE o.payment_status IN ('submitted', 'pending')
              AND o.payment_method != 'cod'
            ORDER BY o.id DESC
        `).all();
    }

    getRevenue() {
        const row = this.db.prepare(
            "SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status != 'Cancelled'"
        ).get();
        return row.total || 0;
    }

    getStats() {
        return {
            total:      this.db.prepare("SELECT COUNT(*) AS c FROM orders").get().c,
            placed:     this.db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'Placed'").get().c,
            processing: this.db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'Processing'").get().c,
            shipped:    this.db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'Shipped'").get().c,
            delivered:  this.db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'Delivered'").get().c,
            cancelled:  this.db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'Cancelled'").get().c,
            revenue:    this.getRevenue()
        };
    }
}

module.exports = OrderRepository;
