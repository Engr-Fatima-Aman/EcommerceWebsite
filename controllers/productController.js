/**
 * PRODUCT CONTROLLER (MVC)
 *
 * Handles all customer-facing product browsing.
 * Uses:
 *   • ProductRepository  (Repository Pattern)
 *   • CategoryRepository (Repository Pattern)
 *   • ProductFactory     (Factory Method)  — to wrap raw rows
 *                                            into typed product objects
 */

const ProductRepository  = require('../patterns/repository/ProductRepository');
const CategoryRepository = require('../patterns/repository/CategoryRepository');
const { ProductFactory } = require('../patterns/factory/ProductFactory');

const productRepo  = new ProductRepository();
const categoryRepo = new CategoryRepository();

// ----- Home Page -----
exports.home = (req, res) => {
    const featured   = productRepo.findFeatured(8);
    const latest     = productRepo.findLatest(8);
    const categories = categoryRepo.findAllWithCounts();

    // Wrap each raw row in a typed Product object via the Factory
    const featuredProducts = featured.map(p => ProductFactory.create(p.type, p));
    const latestProducts   = latest.map(p   => ProductFactory.create(p.type, p));

    res.render('customer/home', {
        featuredProducts,
        latestProducts,
        categories,
        layout: 'layouts/customer',
        pageTitle: 'Home'
    });
};

// ----- Shop / Listings (with filters) -----
exports.shop = (req, res) => {
    const filters = {
        type:     req.query.type     || null,
        material: req.query.material || null,
        occasion: req.query.occasion || null,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
        search:   req.query.search   || null,
        sort:     req.query.sort     || null
    };

    const rawProducts = productRepo.findWithFilters(filters);
    const products    = rawProducts.map(p => ProductFactory.create(p.type, p));

    res.render('customer/shop', {
        products,
        filters,
        categories: categoryRepo.findAllWithCounts(),
        types:      productRepo.getDistinctValues('type'),
        materials:  productRepo.getDistinctValues('material'),
        layout: 'layouts/customer',
        pageTitle: 'Shop'
    });
};

// ----- Product Detail -----
exports.detail = (req, res) => {
    const raw = productRepo.findById(req.params.id);
    if (!raw) return res.status(404).render('customer/404', { layout: 'layouts/customer' });

    const product = ProductFactory.create(raw.type, raw);

    // "Related" — same category, other items
    const related = productRepo.findByCategory(raw.category_id, 4)
                               .filter(p => p.id !== raw.id)
                               .slice(0, 4)
                               .map(p => ProductFactory.create(p.type, p));

    res.render('customer/product-detail', {
        product, related,
        layout: 'layouts/customer',
        pageTitle: product.name
    });
};
