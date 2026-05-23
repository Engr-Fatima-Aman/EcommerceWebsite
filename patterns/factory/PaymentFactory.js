/**
 * ============================================================
 *  DESIGN PATTERN: FACTORY (Abstract Factory style)
 *  Class: PaymentFactory
 * ============================================================
 *  PURPOSE:
 *  Creates different payment-processor objects based on the
 *  payment method chosen by the customer.
 *
 *  NOTE: Each payment processor implements its own `process()`
 *  method. The factory hides the construction details.
 * ============================================================
 */

// -------- Abstract base class --------
class PaymentProcessor {
    constructor(orderData) {
        this.orderData = orderData;
    }
    process() {
        throw new Error("process() must be implemented by subclass");
    }
    getMethodName() {
        return this.constructor.name.replace('Processor', '');
    }
}

// -------- Cash on Delivery (most common in Pakistan) --------
class CashOnDeliveryProcessor extends PaymentProcessor {
    process() {
        return {
            success: true,
            method: 'Cash on Delivery',
            transactionId: 'COD-' + Date.now(),
            message: 'Order will be paid upon delivery. Please keep exact amount ready.',
            amount: this.orderData.total
        };
    }
}

// -------- Bank Transfer (HBL, Meezan, etc.) --------
class BankTransferProcessor extends PaymentProcessor {
    process() {
        return {
            success: true,
            method: 'Bank Transfer',
            transactionId: 'BT-' + Date.now(),
            message: 'Please transfer to: HBL Account 1234-5678-9012. Email receipt to verify.',
            amount: this.orderData.total,
            accountDetails: {
                bank: 'HBL Bank',
                account: '1234-5678-9012-3456',
                title: 'RIWAQ Jewellery'
            }
        };
    }
}

// -------- JazzCash / EasyPaisa (mobile wallets) --------
class MobileWalletProcessor extends PaymentProcessor {
    process() {
        return {
            success: true,
            method: 'JazzCash / EasyPaisa',
            transactionId: 'MW-' + Date.now(),
            message: 'Send payment to 0300-1234567 (RIWAQ) via JazzCash or EasyPaisa.',
            amount: this.orderData.total
        };
    }
}

// -------- Credit / Debit Card (placeholder) --------
class CardPaymentProcessor extends PaymentProcessor {
    process() {
        return {
            success: true,
            method: 'Credit / Debit Card',
            transactionId: 'CARD-' + Date.now(),
            message: 'Card payment processed securely.',
            amount: this.orderData.total
        };
    }
}

/**
 * ============================================================
 *  THE FACTORY
 * ============================================================
 */
class PaymentFactory {
    static create(method, orderData) {
        switch ((method || '').toLowerCase()) {
            case 'cod':
            case 'cash':
                return new CashOnDeliveryProcessor(orderData);
            case 'bank':
            case 'bank_transfer':
                return new BankTransferProcessor(orderData);
            case 'wallet':
            case 'jazzcash':
            case 'easypaisa':
            case 'wallet':
                return new MobileWalletProcessor(orderData);
            case 'card':
            case 'credit':
                return new CardPaymentProcessor(orderData);
            default:
                throw new Error(`Unsupported payment method: ${method}`);
        }
    }

    static getAvailableMethods() {
        return [
            { id: 'cod',    label: 'Cash on Delivery', description: 'Pay when your order arrives at your doorstep' },
            { id: 'bank',   label: 'Bank Transfer',    description: 'HBL, Meezan, UBL and other partner banks' },
            { id: 'wallet', label: 'JazzCash / EasyPaisa', description: 'Mobile wallet transfer' },
            { id: 'card',   label: 'Credit / Debit Card', description: 'Visa, Mastercard — secure online payment' }
        ];
    }
}

module.exports = { PaymentFactory, PaymentProcessor };
