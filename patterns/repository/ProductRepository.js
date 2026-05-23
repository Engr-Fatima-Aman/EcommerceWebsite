/**
 * Concrete REPOSITORY for Products.
 * Encapsulates ALL SQL related to the products table.
 */

const BaseRepository = require('./BaseRepository');

class ProductRepository extends BaseRepository {
    constructor() {
        super('products');
    }

    /**
     * Advanced filtered search — used by the shop page.
     * filters: { type, material, occasion, minPrice, maxPrice, search }
     */
    findWithFilters(filters = {}) {
        let sql = `SELECT p.*, c.name AS category_name
                   FROM products p
                   LEFT JOIN categories c ON c.id = p.category_id
                   WHERE 1=1`;
        const params = [];

        if (filters.type) {
            sql += ' AND LOWER(p.type) = LOWER(?)';
            params.push(filters.type);
        }
        if (filters.material) {
            sql += ' AND LOWER(p.material) = LOWER(?)';
            params.push(filters.material);
        }
        if (filters.occasion) {
            sql += ' AND LOWER(p.occasion) LIKE LOWER(?)';
            params.push(`%${filters.occasion}%`);
        }
        if (filters.minPrice) {
            sql += ' AND p.price >= ?';
            params.push(filters.minPrice);
        }
        if (filters.maxPrice) {
            sql += ' AND p.price <= ?';
            params.push(filters.maxPrice);
        }
        if (filters.search) {
            sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        // Sorting
        if (filters.sort === 'price_asc')        sql += ' ORDER BY p.price ASC';
        else if (filters.sort === 'price_desc')  sql += ' ORDER BY p.price DESC';
        else if (filters.sort === 'name')        sql += ' ORDER BY p.name ASC';
        else                                     sql += ' ORDER BY p.id DESC';

        return this.db.prepare(sql).all(...params);
    }

    findFeatured(limit = 8) {
        return this.db.prepare(
            'SELECT * FROM products WHERE featured = 1 ORDER BY id DESC LIMIT ?'
        ).all(limit);
    }

    findLatest(limit = 8) {
        return this.db.prepare(
            'SELECT * FROM products ORDER BY id DESC LIMIT ?'
        ).all(limit);
    }

    findByCategory(categoryId, limit = 12) {
        return this.db.prepare(
            'SELECT * FROM products WHERE category_id = ? LIMIT ?'
        ).all(categoryId, limit);
    }

    decreaseStock(id, qty) {
        return this.db.prepare(
            'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'
        ).run(qty, id, qty);
    }

    increaseStock(id, qty) {
        return this.db.prepare(
            'UPDATE products SET stock = stock + ? WHERE id = ?'
        ).run(qty, id);
    }

    /** Distinct values for filter dropdowns */
    getDistinctValues(column) {
        const rows = this.db.prepare(
            `SELECT DISTINCT ${column} AS v FROM products WHERE ${column} IS NOT NULL AND ${column} <> '' ORDER BY ${column}`
        ).all();
        return rows.map(r => r.v);
    }
}

module.exports = ProductRepository;
