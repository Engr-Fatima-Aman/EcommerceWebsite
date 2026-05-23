const BaseRepository = require('./BaseRepository');

class CategoryRepository extends BaseRepository {
    constructor() {
        super('categories');
    }

    findAllWithCounts() {
        return this.db.prepare(`
            SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id) AS product_count
            FROM categories c
            ORDER BY c.name
        `).all();
    }
}

module.exports = CategoryRepository;
