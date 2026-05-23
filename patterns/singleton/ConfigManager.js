/**
 * ============================================================
 *  DESIGN PATTERN: SINGLETON
 *  Class: ConfigManager
 * ============================================================
 *  PURPOSE:
 *  Ensures only ONE instance of configuration manager exists
 *  throughout the application lifecycle. Acts as a global
 *  point of access for application-wide configuration.
 *
 *  WHY SINGLETON?
 *  - Configuration should be loaded ONCE and shared everywhere
 *  - Prevents accidental creation of multiple config objects
 *  - Provides a single source of truth for app settings
 * ============================================================
 */

class ConfigManager {
    // Private static instance — the single shared instance
    static #instance = null;

    constructor() {
        // Block direct instantiation after the first time
        if (ConfigManager.#instance) {
            throw new Error("ConfigManager is a Singleton. Use ConfigManager.getInstance()");
        }

        // Initialize configuration (loaded only once)
        this.config = {
            appName: "RIWAQ",
            tagline: "Crafted Elegance, Timeless Beauty",
            currency: "PKR",
            currencySymbol: "Rs.",
            taxRate: 0.05,            // 5% tax
            shippingFee: 250,          // PKR 250 flat shipping
            freeShippingAbove: 25000,  // Free shipping above 25,000 PKR
            supportEmail: "support@riwaq.pk",
            supportPhone: "+92 300 1234567",
            address: "Clifton, Karachi, Pakistan",
            adminEmail: "admin@riwaq.pk",
            sessionSecret: "riwaq-secret-key-2026",
            itemsPerPage: 9,
            maxCartItems: 50
        };

        ConfigManager.#instance = this;
    }

    /**
     * The ONLY way to get a ConfigManager instance.
     * Always returns the same object (singleton property).
     */
    static getInstance() {
        if (!ConfigManager.#instance) {
            ConfigManager.#instance = new ConfigManager();
        }
        return ConfigManager.#instance;
    }

    get(key) {
        return this.config[key];
    }

    getAll() {
        return { ...this.config };
    }

    set(key, value) {
        this.config[key] = value;
    }
}

module.exports = ConfigManager;
