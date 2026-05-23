/**
 * ============================================================
 *  DESIGN PATTERN: SINGLETON
 *  Class: Logger
 * ============================================================
 *  PURPOSE:
 *  Centralized logging system. Only one Logger instance
 *  is created across the entire application.
 *
 *  WHY SINGLETON?
 *  - All logs go through ONE channel (consistent format)
 *  - Single file handle for log files (no file conflicts)
 *  - Easy to swap log destinations later (DB, external service)
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

class Logger {
    static #instance = null;

    constructor() {
        if (Logger.#instance) {
            return Logger.#instance;
        }

        this.logFile = path.join(__dirname, '..', '..', 'data', 'app.log');
        this.logs = [];
        Logger.#instance = this;
    }

    static getInstance() {
        if (!Logger.#instance) {
            Logger.#instance = new Logger();
        }
        return Logger.#instance;
    }

    #write(level, message) {
        const timestamp = new Date().toISOString();
        const entry = `[${timestamp}] [${level}] ${message}`;
        this.logs.push(entry);
        console.log(entry);

        try {
            fs.appendFileSync(this.logFile, entry + '\n');
        } catch (err) {
            // Silently ignore file errors (e.g. on first run)
        }
    }

    info(message)  { this.#write('INFO',  message); }
    warn(message)  { this.#write('WARN',  message); }
    error(message) { this.#write('ERROR', message); }
    debug(message) { this.#write('DEBUG', message); }

    getLogs() {
        return [...this.logs];
    }
}

module.exports = Logger;
