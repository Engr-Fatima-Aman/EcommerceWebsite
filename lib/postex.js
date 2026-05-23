/**
 * ============================================================
 *  PostEx API Client
 * ============================================================
 *  Wraps PostEx Merchant API for COD order booking.
 *  Docs: https://postex.pk → Merchant Login → API Integration
 *
 *  Required env vars:
 *  - POSTEX_API_TOKEN          (from PostEx merchant dashboard)
 *  - POSTEX_API_BASE_URL       (default: https://api.postex.pk)
 *  - POSTEX_PICKUP_ADDRESS_CODE (from getMerchantAddress)
 *  - POSTEX_MERCHANT_NAME      (your registered brand name)
 *
 *  If POSTEX_API_TOKEN is missing, the client returns a stub
 *  tracking number — keeps dev environment working safely.
 * ============================================================
 */

const Logger = require('../patterns/singleton/Logger');

class PostExClient {
    constructor() {
        this.token = process.env.POSTEX_API_TOKEN;
        this.baseUrl = process.env.POSTEX_API_BASE_URL || 'https://api.postex.pk';
        this.pickupCode = process.env.POSTEX_PICKUP_ADDRESS_CODE;
        this.merchantName = process.env.POSTEX_MERCHANT_NAME || 'RIWAQ Jewellery';
        this.configured = !!(this.token && this.pickupCode);

        if (!this.configured) {
            Logger.getInstance().info('📦 PostEx: not fully configured (POSTEX_API_TOKEN + POSTEX_PICKUP_ADDRESS_CODE missing) — bookings will be simulated');
        } else {
            Logger.getInstance().info('📦 PostEx: configured, real bookings enabled');
        }
    }

    /**
     * Create a COD order with PostEx.
     * @param {object} params - { customerName, customerPhone, deliveryAddress, deliveryCity, invoicePayment, orderRefNumber, orderDetail }
     * @returns {Promise<{success, trackingNumber, error}>}
     */
    async createOrder(params) {
        // Dev / not configured → simulate a tracking number
        if (!this.configured) {
            const fakeTracking = 'CX-' + Math.floor(Math.random() * 90000000000 + 10000000000);
            Logger.getInstance().info(`📦 [DEV/SIM] PostEx booking simulated for order ${params.orderRefNumber} → ${fakeTracking}`);
            return { success: true, trackingNumber: fakeTracking, simulated: true };
        }

        // Real API call
        try {
            const body = {
                cityName: params.deliveryCity || 'Karachi',
                customerName: params.customerName,
                customerPhone: this.#normalizePhone(params.customerPhone),
                deliveryAddress: params.deliveryAddress,
                invoiceDivision: 0,
                invoicePayment: Number(params.invoicePayment),
                items: params.items || 1,
                orderDetail: params.orderDetail || `Order #${params.orderRefNumber}`,
                orderRefNumber: String(params.orderRefNumber),
                orderType: 'Normal',
                pickupAddressCode: this.pickupCode,
                transactionNotes: params.notes || ''
            };

            const res = await fetch(`${this.baseUrl}/services/integration/api/order/v3/create-order`, {
                method: 'POST',
                headers: {
                    'token': this.token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.statusCode === '200' && data.dist && data.dist.trackingNumber) {
                Logger.getInstance().info(`📦 PostEx booking SUCCESS for order ${params.orderRefNumber} → ${data.dist.trackingNumber}`);
                return { success: true, trackingNumber: data.dist.trackingNumber };
            }

            Logger.getInstance().error(`📦 PostEx booking FAILED: ${data.statusMessage || 'Unknown error'}`);
            return { success: false, error: data.statusMessage || 'PostEx booking failed' };
        } catch (err) {
            Logger.getInstance().error(`📦 PostEx API error: ${err.message}`);
            return { success: false, error: err.message };
        }
    }

    /**
     * Track an existing PostEx order.
     */
    async trackOrder(trackingNumber) {
        if (!this.configured) {
            return { success: true, status: 'Simulated', simulated: true };
        }
        try {
            const res = await fetch(`${this.baseUrl}/services/integration/api/order/v1/track-order/${encodeURIComponent(trackingNumber)}`, {
                method: 'GET',
                headers: { 'token': this.token }
            });
            const data = await res.json();
            return { success: data.statusCode === '200', data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    #normalizePhone(phone) {
        // PostEx wants 03xxxxxxxxx (11 digits, starting with 03)
        if (!phone) return '';
        let p = String(phone).replace(/[\s\-\+]/g, '');
        if (p.startsWith('92')) p = '0' + p.slice(2);
        return p;
    }
}

// Singleton export
let instance = null;
module.exports = {
    getInstance() {
        if (!instance) instance = new PostExClient();
        return instance;
    }
};
