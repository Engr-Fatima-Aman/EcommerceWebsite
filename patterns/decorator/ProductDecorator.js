/**
 * ============================================================
 *  DESIGN PATTERN: DECORATOR
 *  Family: Product customizations (gift wrap, engraving, etc.)
 * ============================================================
 *  PURPOSE:
 *  Customers can add extra services to ANY product without
 *  creating a new subclass for every combination. Each
 *  decorator WRAPS the product and adds:
 *      • Extra cost
 *      • Extra label / description
 *
 *  Decorators can be STACKED:
 *      product → GiftWrap → Engraving → PremiumPackaging
 *
 *  WHY DECORATOR?
 *  - Add responsibilities at runtime without changing the
 *    underlying Product class
 *  - Any combination of features is supported automatically
 *  - Avoids class explosion (no "GiftWrappedEngravedRing" class)
 * ============================================================
 */

/**
 * Component interface: anything with getPrice() and getDescription()
 * (Our base Product class from ProductFactory already satisfies this
 *  contract, so we wrap it lightly.)
 */
class ProductComponent {
    constructor(product) {
        this.product = product;
    }
    getPrice()       { return this.product.getPrice ? this.product.getPrice() : this.product.price; }
    getDescription() { return this.product.name; }
    getDetails()     { return [];  }
}

/**
 * Base Decorator — every concrete decorator inherits from this.
 */
class ProductDecorator extends ProductComponent {
    constructor(component) {
        super(component);
        this.component = component;
    }
    getPrice()       { return this.component.getPrice(); }
    getDescription() { return this.component.getDescription(); }
    getDetails()     { return this.component.getDetails ? this.component.getDetails() : []; }
}

// -------- Concrete Decorator: Gift Wrap (+ Rs. 300) --------
class GiftWrapDecorator extends ProductDecorator {
    constructor(component, color = 'Maroon') {
        super(component);
        this.color = color;
        this.extraCost = 300;
    }
    getPrice() {
        return this.component.getPrice() + this.extraCost;
    }
    getDescription() {
        return this.component.getDescription() + ` + ${this.color} Gift Wrap`;
    }
    getDetails() {
        return [
            ...this.component.getDetails(),
            { label: 'Gift Wrap',  color: this.color, cost: this.extraCost }
        ];
    }
}

// -------- Concrete Decorator: Engraving (+ Rs. 800) --------
class EngravingDecorator extends ProductDecorator {
    constructor(component, text = '') {
        super(component);
        this.text = text;
        this.extraCost = 800;
    }
    getPrice() {
        return this.component.getPrice() + this.extraCost;
    }
    getDescription() {
        return this.component.getDescription() + ` + Engraving ("${this.text}")`;
    }
    getDetails() {
        return [
            ...this.component.getDetails(),
            { label: 'Engraving', text: this.text, cost: this.extraCost }
        ];
    }
}

// -------- Concrete Decorator: Premium Velvet Box (+ Rs. 500) --------
class PremiumPackagingDecorator extends ProductDecorator {
    constructor(component) {
        super(component);
        this.extraCost = 500;
    }
    getPrice() {
        return this.component.getPrice() + this.extraCost;
    }
    getDescription() {
        return this.component.getDescription() + ' + Premium Velvet Box';
    }
    getDetails() {
        return [
            ...this.component.getDetails(),
            { label: 'Premium Velvet Box', cost: this.extraCost }
        ];
    }
}

// -------- Concrete Decorator: Express Delivery (+ Rs. 600) --------
class ExpressDeliveryDecorator extends ProductDecorator {
    constructor(component) {
        super(component);
        this.extraCost = 600;
    }
    getPrice() {
        return this.component.getPrice() + this.extraCost;
    }
    getDescription() {
        return this.component.getDescription() + ' + Express Delivery';
    }
    getDetails() {
        return [
            ...this.component.getDetails(),
            { label: 'Express Delivery (24h)', cost: this.extraCost }
        ];
    }
}

/**
 * Helper: build a fully-decorated product from a plain
 * options object (e.g. parsed from the checkout form).
 *
 *   buildDecoratedProduct(product, {
 *       giftWrap: 'Maroon',
 *       engraving: 'For Ammi',
 *       premiumBox: true,
 *       express: false
 *   })
 */
function buildDecoratedProduct(product, options = {}) {
    let decorated = new ProductComponent(product);

    if (options.giftWrap) {
        decorated = new GiftWrapDecorator(decorated, options.giftWrap);
    }
    if (options.engraving) {
        decorated = new EngravingDecorator(decorated, options.engraving);
    }
    if (options.premiumBox) {
        decorated = new PremiumPackagingDecorator(decorated);
    }
    if (options.express) {
        decorated = new ExpressDeliveryDecorator(decorated);
    }

    return decorated;
}

module.exports = {
    ProductComponent,
    ProductDecorator,
    GiftWrapDecorator,
    EngravingDecorator,
    PremiumPackagingDecorator,
    ExpressDeliveryDecorator,
    buildDecoratedProduct
};
