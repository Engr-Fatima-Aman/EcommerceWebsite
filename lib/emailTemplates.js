/**
 * Email templates — all branded HTML emails the app sends.
 * Templates accept a `ctx` object with order/customer details.
 *
 * Why functions and not separate .ejs files? Email HTML must
 * include inline CSS (clients strip <style> tags); easier to
 * keep self-contained here.
 */

const BRAND_NAME = process.env.BRAND_NAME || 'RIWAQ Jewellery';
const BRAND_URL = process.env.BRAND_URL || 'http://localhost:3000';
const BRAND_PHONE = process.env.BRAND_PHONE || '+92 300 1234567';
const BRAND_INSTAGRAM = process.env.BRAND_INSTAGRAM || 'https://instagram.com/riwaq';

// ============ SHARED LAYOUT ============
function layout({ title, preheader = '', body }) {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Helvetica,Arial,sans-serif;">
<span style="display:none;color:transparent;visibility:hidden;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#faf7f2;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #e8dfd1;border-radius:8px;max-width:600px;">
      <!-- Header -->
      <tr><td align="center" style="background:#1c1c1c;padding:32px 24px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-family:Georgia,serif;color:#d4af37;font-size:28px;letter-spacing:6px;font-weight:600;">${escape(BRAND_NAME.toUpperCase())}</h1>
        <p style="margin:6px 0 0;color:#fff;font-size:11px;letter-spacing:2px;opacity:0.7;">— PREMIUM JEWELLERY —</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:32px 28px;color:#1c1c1c;font-size:15px;line-height:1.7;">
        ${body}
      </td></tr>
      <!-- Footer -->
      <tr><td align="center" style="background:#faf7f2;padding:20px 24px;border-top:1px solid #e8dfd1;border-radius:0 0 8px 8px;color:#666;font-size:12px;">
        <p style="margin:0 0 6px;">Need help? Reply to this email or call <a href="tel:${BRAND_PHONE}" style="color:#b8860b;text-decoration:none;">${escape(BRAND_PHONE)}</a></p>
        <p style="margin:0;"><a href="${BRAND_INSTAGRAM}" style="color:#b8860b;text-decoration:none;">Instagram</a> · <a href="${BRAND_URL}" style="color:#b8860b;text-decoration:none;">Visit Store</a></p>
        <p style="margin:14px 0 0;font-size:11px;color:#999;">© ${new Date().getFullYear()} ${escape(BRAND_NAME)}. Crafted with care in Karachi.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escape(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function money(n) {
    return 'Rs. ' + Number(n || 0).toLocaleString('en-PK');
}

// ============ TEMPLATE: ORDER CONFIRMATION ============
function orderConfirmation(ctx) {
    const { order, items, customer, paymentInstructions, trackingNumber } = ctx;

    const itemRows = items.map(i => `
        <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f0e8d8;">
                <strong>${escape(i.name)}</strong>
                <div style="color:#888;font-size:13px;">Qty: ${i.quantity}</div>
            </td>
            <td align="right" style="padding:10px 0;border-bottom:1px solid #f0e8d8;font-weight:600;">${money(i.price * i.quantity)}</td>
        </tr>`).join('');

    const trackingBlock = trackingNumber ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7d6;border:1px dashed #d4a017;border-radius:6px;margin:20px 0;">
            <tr><td style="padding:14px 18px;">
                <p style="margin:0;font-size:12px;color:#8a6800;letter-spacing:1px;text-transform:uppercase;">PostEx Tracking Number</p>
                <p style="margin:6px 0 0;font-family:Courier,monospace;font-size:18px;font-weight:bold;letter-spacing:1px;">${escape(trackingNumber)}</p>
                <p style="margin:10px 0 0;font-size:13px;color:#5a4500;">Track at: <a href="https://postex.pk/tracking" style="color:#722f37;">postex.pk/tracking</a></p>
            </td></tr>
        </table>` : '';

    const paymentBlock = paymentInstructions ? `
        <h3 style="font-family:Georgia,serif;color:#722f37;margin:24px 0 12px;">Payment Instructions</h3>
        <div style="background:#faf7f2;border-left:4px solid #b8860b;padding:16px 20px;border-radius:4px;font-size:14px;line-height:1.8;">
            ${paymentInstructions}
        </div>` : '';

    const body = `
        <h2 style="font-family:Georgia,serif;color:#1c1c1c;margin:0 0 8px;font-size:24px;">Thank you, ${escape(customer.name.split(' ')[0])}! 💎</h2>
        <p style="margin:0 0 20px;color:#666;">Your order has been received and we're getting it ready for you.</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f2;border-radius:6px;margin:20px 0;">
            <tr>
                <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:11px;color:#888;letter-spacing:1px;text-transform:uppercase;">Order Number</p>
                    <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:20px;font-weight:600;">#${escape(order.id)}</p>
                </td>
                <td align="right" style="padding:14px 18px;">
                    <p style="margin:0;font-size:11px;color:#888;letter-spacing:1px;text-transform:uppercase;">Total</p>
                    <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:20px;font-weight:600;color:#b8860b;">${money(order.total)}</p>
                </td>
            </tr>
        </table>

        ${trackingBlock}
        ${paymentBlock}

        <h3 style="font-family:Georgia,serif;color:#1c1c1c;margin:28px 0 8px;">Order Details</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${itemRows}
            <tr><td style="padding:14px 0 4px;color:#666;">Subtotal</td><td align="right" style="padding:14px 0 4px;color:#666;">${money(order.subtotal)}</td></tr>
            ${order.discount > 0 ? `<tr><td style="padding:4px 0;color:#2d7a2d;">Discount${order.coupon ? ' (' + escape(order.coupon) + ')' : ''}</td><td align="right" style="padding:4px 0;color:#2d7a2d;">− ${money(order.discount)}</td></tr>` : ''}
            <tr><td style="padding:4px 0;color:#666;">Shipping</td><td align="right" style="padding:4px 0;color:#666;">${order.shipping === 0 ? 'FREE' : money(order.shipping)}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Tax</td><td align="right" style="padding:4px 0;color:#666;">${money(order.tax)}</td></tr>
            <tr><td colspan="2" style="border-top:1px solid #e8dfd1;padding-top:8px;"></td></tr>
            <tr><td style="font-family:Georgia,serif;font-size:18px;font-weight:600;">Total</td><td align="right" style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#b8860b;">${money(order.total)}</td></tr>
        </table>

        <h3 style="font-family:Georgia,serif;color:#1c1c1c;margin:28px 0 8px;">Shipping To</h3>
        <p style="margin:0;color:#444;">
            ${escape(customer.name)}<br>
            ${escape(order.address)}<br>
            ${escape(order.city)}<br>
            📞 ${escape(order.phone)}
        </p>

        <p style="text-align:center;margin:32px 0 0;">
            <a href="${BRAND_URL}/orders/${escape(order.id)}" style="display:inline-block;background:#b8860b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:600;">View Order</a>
        </p>
    `;

    return layout({
        title: `Order #${order.id} confirmed — ${BRAND_NAME}`,
        preheader: `Your order #${order.id} for ${money(order.total)} has been received.`,
        body
    });
}

// ============ TEMPLATE: ORDER STATUS UPDATE ============
function orderStatusUpdate(ctx) {
    const { order, customer, status, trackingNumber } = ctx;

    const statusMessages = {
        'Processing':  { color: '#b8860b', emoji: '⚙️',  message: 'We\'re preparing your order with care. Each piece is being checked and polished before dispatch.' },
        'Shipped':     { color: '#0a66c2', emoji: '📦',  message: 'Your order is on its way! It should reach you within 2-5 working days.' },
        'Delivered':   { color: '#2d7a2d', emoji: '✨',  message: 'Your order has been delivered. We hope you love your new piece — please share a photo with us on Instagram!' },
        'Cancelled':   { color: '#c0392b', emoji: '❌',  message: 'Your order has been cancelled. Any payment made will be refunded within 5-7 working days.' }
    };
    const info = statusMessages[status] || { color: '#888', emoji: '📋', message: `Your order status has been updated to "${status}".` };

    const trackingBlock = trackingNumber && (status === 'Shipped' || status === 'Processing') ? `
        <p style="margin:16px 0 0;">Track your package: <a href="https://postex.pk/tracking" style="color:#b8860b;">postex.pk/tracking</a> using <strong>${escape(trackingNumber)}</strong></p>` : '';

    const body = `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="display:inline-block;background:${info.color};color:#fff;padding:8px 20px;border-radius:99px;font-size:13px;letter-spacing:2px;text-transform:uppercase;">${escape(status)}</div>
        </div>
        <h2 style="font-family:Georgia,serif;text-align:center;color:#1c1c1c;margin:0 0 16px;">${info.emoji} Order #${escape(order.id)} Update</h2>
        <p style="text-align:center;color:#666;font-size:15px;">${escape(info.message)}</p>
        ${trackingBlock}
        <p style="text-align:center;margin:32px 0 0;">
            <a href="${BRAND_URL}/orders/${escape(order.id)}" style="display:inline-block;background:#b8860b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:600;">View Order Details</a>
        </p>`;

    return layout({
        title: `Order #${order.id} is now ${status} — ${BRAND_NAME}`,
        preheader: `Your order #${order.id} is now ${status}.`,
        body
    });
}

// ============ TEMPLATE: PAYMENT VERIFIED (for bank/jazzcash orders) ============
function paymentVerified(ctx) {
    const { order } = ctx;
    const body = `
        <h2 style="font-family:Georgia,serif;color:#2d7a2d;margin:0 0 12px;">✓ Payment Verified</h2>
        <p style="color:#666;font-size:15px;">Great news! We've confirmed your payment for order <strong>#${escape(order.id)}</strong>. Your order is now being prepared for dispatch.</p>
        <p style="text-align:center;margin:32px 0 0;">
            <a href="${BRAND_URL}/orders/${escape(order.id)}" style="display:inline-block;background:#b8860b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:600;">View Order</a>
        </p>`;
    return layout({
        title: `Payment verified for order #${order.id}`,
        preheader: 'Your payment has been confirmed.',
        body
    });
}

// ============ TEMPLATE: WELCOME ============
function welcome(ctx) {
    const { customer } = ctx;
    const body = `
        <h2 style="font-family:Georgia,serif;color:#1c1c1c;margin:0 0 12px;">Welcome to ${escape(BRAND_NAME)}, ${escape(customer.name.split(' ')[0])} 💎</h2>
        <p style="color:#666;font-size:15px;">Thank you for joining our community. You'll be the first to know about new collections, exclusive offers, and bridal launches.</p>
        <p style="color:#666;font-size:15px;">Here's a little something to start your journey with us:</p>
        <div style="text-align:center;background:#faf7f2;border:2px dashed #b8860b;padding:24px;border-radius:8px;margin:24px 0;">
            <p style="margin:0;font-size:13px;color:#888;letter-spacing:2px;text-transform:uppercase;">Welcome Offer</p>
            <p style="margin:8px 0;font-family:Courier,monospace;font-size:24px;font-weight:bold;color:#b8860b;letter-spacing:3px;">WELCOME500</p>
            <p style="margin:0;font-size:13px;color:#666;">Get Rs. 500 off on orders above Rs. 3,000</p>
        </div>
        <p style="text-align:center;margin:32px 0 0;">
            <a href="${BRAND_URL}/shop" style="display:inline-block;background:#b8860b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:600;">Start Shopping</a>
        </p>`;
    return layout({
        title: `Welcome to ${BRAND_NAME}`,
        preheader: 'Welcome — your first-order coupon is inside.',
        body
    });
}

module.exports = {
    orderConfirmation,
    orderStatusUpdate,
    paymentVerified,
    welcome
};
