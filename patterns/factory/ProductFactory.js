/**
 * ============================================================
 *  DESIGN PATTERN: FACTORY METHOD
 *  Class: ProductFactory
 * ============================================================
 *  PURPOSE:
 *  Creates different types of jewellery products (Ring,
 *  Necklace, Earring, Bracelet) WITHOUT exposing the
 *  instantiation logic to the client code.
 *
 *  WHY FACTORY METHOD?
 *  - Each product type has unique properties:
 *      Ring     → size (US ring sizes)
 *      Necklace → length (in inches)
 *      Earring  → pair/single, back-type
 *      Bracelet → length, clasp-type
 *  - Client code just says "give me a Ring" — doesn't care HOW
 *  - Easy to add new product types later without breaking code
 * ============================================================
 */

// -------- Base Product Class (product blueprint) ----------
class Product {
    constructor(data) {
        this.id          = data.id;
        this.name        = data.name;
        this.description = data.description;
        this.price       = parseFloat(data.price);
        this.material    = data.material;     // Gold, Silver, Diamond, etc.
        this.occasion    = data.occasion;     // Wedding, Daily, Party, etc.
        this.stock       = data.stock;
        this.image       = data.image;
        this.category_id = data.category_id;
        this.type        = data.type;
        this.featured    = data.featured || 0;
    }

    getInfo() {
        return `${this.name} — ${this.material} ${this.type}`;
    }

    getPrice() {
        return this.price;
    }
}

// -------- Concrete Product: Ring -------------------------
class Ring extends Product {
    constructor(data) {
        super(data);
        this.type     = 'Ring';
        this.size     = data.size     || 'Adjustable';
        this.bandType = data.bandType || 'Solitaire';
    }
    getDetails() {
        return `Ring — Size: ${this.size}, Band: ${this.bandType}`;
    }
}

// -------- Concrete Product: Necklace ---------------------
class Necklace extends Product {
    constructor(data) {
        super(data);
        this.type      = 'Necklace';
        this.length    = data.length    || '18"';
        this.chainType = data.chainType || 'Rope';
    }
    getDetails() {
        return `Necklace — Length: ${this.length}, Chain: ${this.chainType}`;
    }
}

// -------- Concrete Product: Earring ----------------------
class Earring extends Product {
    constructor(data) {
        super(data);
        this.type     = 'Earring';
        this.style    = data.style    || 'Stud';        // Stud, Hoop, Drop
        this.backType = data.backType || 'Push Back';
    }
    getDetails() {
        return `Earrings — Style: ${this.style}, Back: ${this.backType}`;
    }
}

// -------- Concrete Product: Bracelet ---------------------
class Bracelet extends Product {
    constructor(data) {
        super(data);
        this.type      = 'Bracelet';
        this.length    = data.length    || '7"';
        this.claspType = data.claspType || 'Lobster';
    }
    getDetails() {
        return `Bracelet — Length: ${this.length}, Clasp: ${this.claspType}`;
    }
}

/**
 * ============================================================
 *  THE FACTORY ITSELF
 * ============================================================
 *  Instead of doing `new Ring(...)` everywhere, callers do:
 *      ProductFactory.create('ring', data)
 *  Centralizes the creation logic.
 */
class ProductFactory {
    static create(type, data) {
        switch ((type || '').toLowerCase()) {
            case 'ring':
                return new Ring(data);
            case 'necklace':
                return new Necklace(data);
            case 'earring':
            case 'earrings':
                return new Earring(data);
            case 'bracelet':
                return new Bracelet(data);
            default:
                // Fallback for unknown / generic products
                return new Product(data);
        }
    }

    static getSupportedTypes() {
        return ['Ring', 'Necklace', 'Earring', 'Bracelet'];
    }
}

module.exports = { ProductFactory, Product, Ring, Necklace, Earring, Bracelet };
