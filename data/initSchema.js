/**
 * Initializes the SQLite database schema.
 * Called automatically by server.js on startup if the DB
 * is empty. Idempotent — safe to call repeatedly.
 */

const DatabaseManager = require('../patterns/singleton/DatabaseManager');

function initSchema() {
    const db = DatabaseManager.getInstance().getConnection();

    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        email       TEXT    UNIQUE NOT NULL,
        password    TEXT    NOT NULL,
        role        TEXT    NOT NULL DEFAULT 'customer',
        phone       TEXT,
        address     TEXT,
        city        TEXT,
        created_at  TEXT    DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    UNIQUE NOT NULL,
        description TEXT,
        icon        TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        description TEXT,
        price       REAL    NOT NULL,
        category_id INTEGER,
        type        TEXT    NOT NULL,
        material    TEXT,
        occasion    TEXT,
        size        TEXT,
        length      TEXT,
        weight      REAL,
        stock       INTEGER DEFAULT 10,
        image       TEXT,
        featured    INTEGER DEFAULT 0,
        created_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS wishlist (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        product_id  INTEGER NOT NULL,
        added_at    TEXT    DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id),
        FOREIGN KEY (user_id)    REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id         INTEGER NOT NULL,
        subtotal        REAL    NOT NULL,
        discount        REAL    DEFAULT 0,
        shipping        REAL    DEFAULT 0,
        tax             REAL    DEFAULT 0,
        total           REAL    NOT NULL,
        status          TEXT    DEFAULT 'Placed',
        payment_method  TEXT,
        payment_status  TEXT    DEFAULT 'pending',
        payment_proof   TEXT,
        tracking_number TEXT,
        coupon          TEXT,
        address         TEXT,
        city            TEXT,
        phone           TEXT,
        notes           TEXT,
        created_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id        INTEGER NOT NULL,
        product_id      INTEGER NOT NULL,
        quantity        INTEGER NOT NULL,
        price           REAL    NOT NULL,
        customizations  TEXT,
        FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    `);

    // ----- Migration: add new columns to orders table for existing databases -----
    const orderColumns = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
    if (!orderColumns.includes('payment_status')) {
        db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'");
    }
    if (!orderColumns.includes('payment_proof')) {
        db.exec("ALTER TABLE orders ADD COLUMN payment_proof TEXT");
    }
    if (!orderColumns.includes('tracking_number')) {
        db.exec("ALTER TABLE orders ADD COLUMN tracking_number TEXT");
    }
}

module.exports = { initSchema };
