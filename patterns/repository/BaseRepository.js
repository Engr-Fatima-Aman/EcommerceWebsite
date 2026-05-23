/**
 * ============================================================
 *  DESIGN PATTERN: REPOSITORY
 *  Class: BaseRepository (abstract)
 * ============================================================
 *  PURPOSE:
 *  Provides a CLEAN abstraction over the data layer.
 *  Controllers never touch raw SQL — they only call repository
 *  methods (findAll, findById, create, update, delete).
 *
 *  WHY REPOSITORY?
 *  - Separates business logic from persistence logic
 *  - If we swap SQLite for MongoDB later, only repositories
 *    change — controllers stay untouched
 *  - All SQL is centralized & unit-testable
 * ============================================================
 */

const DatabaseManager = require('../singleton/DatabaseManager');
const Logger          = require('../singleton/Logger');

class BaseRepository {
    constructor(tableName) {
        if (new.target === BaseRepository) {
            throw new Error("BaseRepository is abstract — extend it");
        }
        this.tableName = tableName;
        this.db = DatabaseManager.getInstance().getConnection();
        this.logger = Logger.getInstance();
    }

    findAll() {
        return this.db.prepare(`SELECT * FROM ${this.tableName}`).all();
    }

    findById(id) {
        return this.db
            .prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`)
            .get(id);
    }

    findWhere(column, value) {
        return this.db
            .prepare(`SELECT * FROM ${this.tableName} WHERE ${column} = ?`)
            .all(value);
    }

    findOneWhere(column, value) {
        return this.db
            .prepare(`SELECT * FROM ${this.tableName} WHERE ${column} = ?`)
            .get(value);
    }

    create(data) {
        const cols   = Object.keys(data);
        const placeholders = cols.map(() => '?').join(', ');
        const values = Object.values(data);
        const sql = `INSERT INTO ${this.tableName} (${cols.join(', ')}) VALUES (${placeholders})`;
        const result = this.db.prepare(sql).run(...values);
        this.logger.info(`[${this.tableName}] Created row id=${result.lastInsertRowid}`);
        return result.lastInsertRowid;
    }

    update(id, data) {
        const cols  = Object.keys(data);
        const setClause = cols.map(c => `${c} = ?`).join(', ');
        const values = [...Object.values(data), id];
        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
        const result = this.db.prepare(sql).run(...values);
        this.logger.info(`[${this.tableName}] Updated row id=${id}`);
        return result.changes;
    }

    delete(id) {
        const result = this.db
            .prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
            .run(id);
        this.logger.info(`[${this.tableName}] Deleted row id=${id}`);
        return result.changes;
    }

    count() {
        return this.db
            .prepare(`SELECT COUNT(*) AS c FROM ${this.tableName}`)
            .get().c;
    }
}

module.exports = BaseRepository;
