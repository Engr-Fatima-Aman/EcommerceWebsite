/**
 * ============================================================
 *  DESIGN PATTERN: OBSERVER
 *  Subject: OrderSubject
 *  Observers:
 *    1. EmailNotifier              (REAL — Nodemailer via Gmail SMTP)
 *    2. SMSNotifier                (stubbed — needs paid SMS gateway)
 *    3. AdminDashboardNotifier     (stubbed — server log only)
 *    4. InventoryUpdater           (REAL — actually decrements stock)
 *    5. PostExCourierBooker        (REAL — books COD orders with PostEx)
 * ============================================================
 *  This file demonstrates the Observer pattern's biggest strength:
 *  observers can be REAL or STUBBED independently, and the
 *  OrderSubject doesn't know or care which is which. To plug in
 *  a real SMS provider tomorrow, only SMSNotifier changes.
 * ============================================================
 */

const Logger = require('../singleton/Logger');
const Mailer = require('../../lib/mailer');
const templates = require('../../lib/emailTemplates');
const PostEx = require('../../lib/postex');
const ProductRepository = require('../repository/ProductRepository');

class Observer {
    update(eventData) { throw new Error("Observer.update() must be implemented"); }
}

class OrderSubject {
    constructor() { this.observers = []; }

    attach(observer) {
        if (!(observer instanceof Observer)) throw new Error("Only Observer instances can be attached");
        this.observers.push(observer);
        Logger.getInstance().info(`Observer attached: ${observer.constructor.name}`);
    }

    detach(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    async notify(eventData) {
        Logger.getInstance().info(`OrderSubject notifying ${this.observers.length} observer(s) of event "${eventData.event || eventData.status}"`);
        const results = [];
        for (const observer of this.observers) {
            try {
                const result = await observer.update(eventData);
                results.push({ observer: observer.constructor.name, ...result });
            } catch (err) {
                Logger.getInstance().error(`Observer ${observer.constructor.name} failed: ${err.message}`);
                results.push({ observer: observer.constructor.name, sent: false, message: err.message });
            }
        }
        return results;
    }
}

// ============================================================
//  Observer #1: EmailNotifier (REAL)
// ============================================================
class EmailNotifier extends Observer {
    async update(eventData) {
        const { customerEmail, customerName, orderId, status, event } = eventData;
        if (!customerEmail) {
            return { channel: 'email', sent: false, message: 'No customer email — skipped.' };
        }

        const mailer = Mailer.getInstance();
        const customer = { name: customerName || 'Customer', email: customerEmail };
        let html, subject;

        if (event === 'order_placed') {
            subject = `Order #${orderId} confirmed — RIWAQ`;
            html = templates.orderConfirmation({
                order: eventData.order,
                items: eventData.items || [],
                customer,
                paymentInstructions: eventData.paymentInstructions || null,
                trackingNumber: eventData.trackingNumber || null
            });
        } else if (event === 'payment_verified') {
            subject = `Payment verified for order #${orderId} — RIWAQ`;
            html = templates.paymentVerified({ order: eventData.order });
        } else if (event === 'welcome') {
            subject = `Welcome to RIWAQ 💎`;
            html = templates.welcome({ customer });
        } else {
            subject = `Order #${orderId} is now ${status} — RIWAQ`;
            html = templates.orderStatusUpdate({
                order: eventData.order || { id: orderId },
                customer,
                status,
                trackingNumber: eventData.trackingNumber || null
            });
        }

        const result = await mailer.send({ to: customerEmail, subject, html });
        const msg = result.sent
            ? `📧 EMAIL → ${customerEmail}: "${subject}" sent successfully.`
            : `📧 EMAIL → ${customerEmail}: send failed (${result.error}).`;
        Logger.getInstance().info(msg);

        return { channel: 'email', sent: result.sent, message: msg };
    }
}

// ============================================================
//  Observer #2: SMSNotifier (stubbed)
// ============================================================
class SMSNotifier extends Observer {
    update(eventData) {
        const msg = `📱 SMS → ${eventData.customerPhone || 'N/A'}: RIWAQ Order #${eventData.orderId} status: ${eventData.status}.`;
        Logger.getInstance().info(msg);
        return { channel: 'sms', sent: true, message: msg, stubbed: true };
    }
}

// ============================================================
//  Observer #3: AdminDashboardNotifier (stubbed)
// ============================================================
class AdminDashboardNotifier extends Observer {
    update(eventData) {
        const msg = `🖥️  ADMIN-DASHBOARD: Order #${eventData.orderId} updated to "${eventData.status}".`;
        Logger.getInstance().info(msg);
        return { channel: 'admin_dashboard', sent: true, message: msg };
    }
}

// ============================================================
//  Observer #4: InventoryUpdater (REAL)
// ============================================================
class InventoryUpdater extends Observer {
    update(eventData) {
        const productRepo = new ProductRepository();
        if (eventData.status === 'Placed' && eventData.items) {
            for (const item of eventData.items) {
                try { productRepo.decreaseStock(item.product_id, item.quantity); }
                catch (e) { Logger.getInstance().error(`Inventory decrease failed for product ${item.product_id}: ${e.message}`); }
            }
            const msg = `📦 INVENTORY: Stock decreased for ${eventData.items.length} item(s) in order #${eventData.orderId}.`;
            Logger.getInstance().info(msg);
            return { channel: 'inventory', sent: true, message: msg };
        }
        if (eventData.status === 'Cancelled' && eventData.items) {
            for (const item of eventData.items) {
                try { productRepo.increaseStock(item.product_id, item.quantity); }
                catch (e) { Logger.getInstance().error(`Inventory restore failed for product ${item.product_id}: ${e.message}`); }
            }
            const msg = `📦 INVENTORY: Stock restored for ${eventData.items.length} item(s) from cancelled order #${eventData.orderId}.`;
            Logger.getInstance().info(msg);
            return { channel: 'inventory', sent: true, message: msg };
        }
        return { channel: 'inventory', sent: false, message: 'No inventory change required.' };
    }
}

// ============================================================
//  Observer #5: PostExCourierBooker (REAL)
// ============================================================
class PostExCourierBooker extends Observer {
    async update(eventData) {
        if (eventData.event !== 'order_placed') {
            return { channel: 'courier', sent: false, message: 'Not an order placement — skipped.' };
        }
        if (eventData.paymentMethod !== 'cod') {
            return { channel: 'courier', sent: false, message: `Non-COD order — courier will be booked after payment verification.` };
        }

        const postex = PostEx.getInstance();
        const result = await postex.createOrder({
            customerName: eventData.customerName,
            customerPhone: eventData.customerPhone,
            deliveryAddress: eventData.address,
            deliveryCity: eventData.city,
            invoicePayment: eventData.order.total,
            orderRefNumber: eventData.orderId,
            orderDetail: `RIWAQ jewellery — ${(eventData.items || []).length} item(s)`,
            items: (eventData.items || []).length
        });

        if (result.success) {
            if (typeof eventData.onTrackingNumber === 'function') {
                eventData.onTrackingNumber(result.trackingNumber);
            }
            const msg = `🚚 COURIER: PostEx booked — tracking ${result.trackingNumber}${result.simulated ? ' (simulated)' : ''}.`;
            Logger.getInstance().info(msg);
            return { channel: 'courier', sent: true, message: msg, trackingNumber: result.trackingNumber };
        }

        const msg = `🚚 COURIER: PostEx booking failed — ${result.error}`;
        Logger.getInstance().error(msg);
        return { channel: 'courier', sent: false, message: msg };
    }
}

module.exports = {
    Observer,
    OrderSubject,
    EmailNotifier,
    SMSNotifier,
    AdminDashboardNotifier,
    InventoryUpdater,
    PostExCourierBooker
};
