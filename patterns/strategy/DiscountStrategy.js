/**
 * ============================================================
 *  DESIGN PATTERN: STRATEGY
 *  Family: Discount calculation algorithms
 * ============================================================
 *  PURPOSE:
 *  Different discount rules need different math:
 *      • Percentage off (e.g. 10%)
 *      • Flat amount off (e.g. PKR 500)
 *      • Buy-X-Get-Y-Free
 *      • No discount
 *
 *  Instead of using a tangled `if/else` chain, each strategy
 *  is its own class with a uniform `apply(cartTotal, items)`
 *  method. The Context picks one strategy at runtime.
 *
 *  WHY STRATEGY?
 *  - Algorithms can be swapped at runtime
 *  - Each algorithm is isolated and testable
 *  - New discount types can be added without modifying the
 *    Context (Open/Closed Principle)
 * ============================================================
 */

// -------- Abstract Strategy --------
class DiscountStrategy {
    apply(cartTotal, items) {
        throw new Error("apply() must be implemented");
    }
    getDescription() { return 'No description'; }
}

// -------- Concrete Strategy: No Discount --------
class NoDiscountStrategy extends DiscountStrategy {
    apply(cartTotal /*, items */) {
        return { discount: 0, finalTotal: cartTotal, applied: 'No discount' };
    }
    getDescription() { return 'Regular price'; }
}

// -------- Concrete Strategy: Percentage Discount --------
class PercentageDiscountStrategy extends DiscountStrategy {
    constructor(percentage) {
        super();
        this.percentage = percentage;       // e.g. 10 for 10%
    }
    apply(cartTotal /*, items */) {
        const discount = Math.round((cartTotal * this.percentage) / 100);
        return {
            discount,
            finalTotal: cartTotal - discount,
            applied: `${this.percentage}% off`
        };
    }
    getDescription() { return `${this.percentage}% off entire order`; }
}

// -------- Concrete Strategy: Flat / Fixed Amount Discount --------
class FixedDiscountStrategy extends DiscountStrategy {
    constructor(amount, minSpend = 0) {
        super();
        this.amount   = amount;
        this.minSpend = minSpend;
    }
    apply(cartTotal /*, items */) {
        if (cartTotal < this.minSpend) {
            return {
                discount: 0,
                finalTotal: cartTotal,
                applied: `Spend Rs.${this.minSpend} to unlock`
            };
        }
        const discount = Math.min(this.amount, cartTotal);
        return {
            discount,
            finalTotal: cartTotal - discount,
            applied: `Flat Rs.${this.amount} off`
        };
    }
    getDescription() {
        return `Rs.${this.amount} off (min spend Rs.${this.minSpend})`;
    }
}

// -------- Concrete Strategy: Buy-One-Get-One-Free (cheapest free) --------
class BuyOneGetOneStrategy extends DiscountStrategy {
    apply(cartTotal, items) {
        if (!items || items.length < 2) {
            return { discount: 0, finalTotal: cartTotal, applied: 'Need 2+ items for BOGO' };
        }
        // Sort prices ascending; every second item (cheapest among each pair) is free
        const prices = items
            .flatMap(i => Array(i.quantity).fill(parseFloat(i.price)))
            .sort((a, b) => a - b);

        let discount = 0;
        for (let i = 0; i < prices.length; i += 2) {
            discount += prices[i];
        }
        discount = Math.round(discount);

        return {
            discount,
            finalTotal: cartTotal - discount,
            applied: 'Buy One Get One Free'
        };
    }
    getDescription() { return 'Buy One Get One Free (cheapest item free)'; }
}

/**
 * ============================================================
 *  CONTEXT: DiscountContext
 *  Holds a strategy and delegates to it. The rest of the
 *  application talks ONLY to this class.
 * ============================================================
 */
class DiscountContext {
    constructor(strategy) {
        this.setStrategy(strategy || new NoDiscountStrategy());
    }

    setStrategy(strategy) {
        if (!(strategy instanceof DiscountStrategy)) {
            throw new Error("Strategy must extend DiscountStrategy");
        }
        this.strategy = strategy;
    }

    calculate(cartTotal, items) {
        return this.strategy.apply(cartTotal, items);
    }
}

/**
 * Coupon-code lookup → returns appropriate strategy.
 * Easy to extend: just add another entry below.
 */
function getStrategyForCoupon(code) {
    const c = (code || '').toUpperCase().trim();
    switch (c) {
        case 'EID10':       return new PercentageDiscountStrategy(10);
        case 'WELCOME500':  return new FixedDiscountStrategy(500, 3000);
        case 'NEWYEAR20':   return new PercentageDiscountStrategy(20);
        case 'BOGO':        return new BuyOneGetOneStrategy();
        default:            return null;
    }
}

module.exports = {
    DiscountStrategy,
    NoDiscountStrategy,
    PercentageDiscountStrategy,
    FixedDiscountStrategy,
    BuyOneGetOneStrategy,
    DiscountContext,
    getStrategyForCoupon
};
