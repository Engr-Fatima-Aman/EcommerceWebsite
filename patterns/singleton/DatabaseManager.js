/**
 * ============================================================
 *  DESIGN PATTERN: SINGLETON
 *  Class: DatabaseManager
 * ============================================================
 *  PURPOSE:
 *  Manages a SINGLE database connection across the entire app.
 *  Opening multiple SQLite connections wastes resources and
 *  can cause locking issues, so we enforce one instance.
 *
 *  WHY SINGLETON?
 *  - One DB connection shared by ALL repositories
 *  - Eliminates connection leaks and contention
 *  - Centralizes connection configuration
 *
 *  Uses Node.js v22's built-in `node:sqlite` module (synchronous,
 *  same API style as better-sqlite3 — prepare(), run(), get(), all()).
 *  Run the server with the `--experimental-sqlite` flag.
 * ============================================================
 */

const { DatabaseSync } = require('node:sqlite');
const path  = require('path');
const fs    = require('fs');
const Logger = require('./Logger');

class DatabaseManager {
    static #instance = null;

    constructor() {
        if (DatabaseManager.#instance) {
            throw new Error("DatabaseManager is a Singleton. Use DatabaseManager.getInstance()");
        }

        const dataDir = path.join(__dirname, '..', '..', 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        const dbPath = path.join(dataDir, 'riwaq.db');

        this.db = new DatabaseSync(dbPath);
        this.db.exec('PRAGMA journal_mode = WAL');
        this.db.exec('PRAGMA foreign_keys = ON');

        Logger.getInstance().info(`Database connected at ${dbPath}`);
        DatabaseManager.#instance = this;
    }

    static getInstance() {
        if (!DatabaseManager.#instance) {
            DatabaseManager.#instance = new DatabaseManager();
        }
        return DatabaseManager.#instance;
    }

    getConnection() {
        return this.db;
    }

    close() {
        if (this.db) this.db.close();
    }
}

module.exports = DatabaseManager;
