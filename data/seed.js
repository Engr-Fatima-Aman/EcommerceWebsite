/**
 * Seeds the database with default categories, products, and
 * an admin account. Runs once unless the DB is wiped.
 */

const bcrypt          = require('bcryptjs');
const DatabaseManager = require('../patterns/singleton/DatabaseManager');
const { initSchema }  = require('./initSchema');

function seed() {
    initSchema();

    const db = DatabaseManager.getInstance().getConnection();

    // ----- Admin & sample customer (only if no users yet) -----
    const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    if (userCount === 0) {
        const adminPwd    = bcrypt.hashSync('admin123', 10);
        const customerPwd = bcrypt.hashSync('customer123', 10);

        db.prepare(`INSERT INTO users (name, email, password, role, phone, address, city)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run('RIWAQ Admin', 'admin@riwaq.pk', adminPwd, 'admin', '+92 300 1234567', 'Clifton', 'Karachi');

        db.prepare(`INSERT INTO users (name, email, password, role, phone, address, city)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run('Fatima Aman', 'fatima@example.com', customerPwd, 'customer', '+92 321 9876543', 'DHA Phase 6', 'Karachi');
    }

    // ----- Categories -----
    const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
    if (catCount === 0) {
        const categories = [
            { name: 'Rings',     description: 'Solitaire, band & statement rings',         icon: 'bi-circle' },
            { name: 'Necklaces', description: 'Pendants, chains & elegant neckpieces',      icon: 'bi-gem' },
            { name: 'Earrings',  description: 'Studs, hoops, drops and chandeliers',        icon: 'bi-stars' },
            { name: 'Bracelets', description: 'Bangles, cuffs and tennis bracelets',        icon: 'bi-bookmark-star' }
        ];
        const insert = db.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)');
        for (const c of categories) insert.run(c.name, c.description, c.icon);
    }

    // ----- Products -----
    const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
    if (productCount === 0) {
        const cats = db.prepare('SELECT id, name FROM categories').all();
        const catId = (n) => cats.find(c => c.name === n).id;

        const products = [
            // RINGS
            { name: "Aurelia Solitaire Ring",  description: "A timeless solitaire featuring a brilliant-cut centre stone set in 18k yellow gold. The four-prong setting elevates the stone to catch light from every angle.",
              price: 45000, category_id: catId('Rings'), type: 'Ring', material: 'Gold', occasion: 'Wedding,Engagement', size: '6', stock: 12, featured: 1, image: '/img/products/ring-1.svg' },
            { name: "Noor Diamond Halo Ring",  description: "Halo of micro-pavé diamonds surrounding a central solitaire. Crafted in white gold with a knife-edge band.",
              price: 78000, category_id: catId('Rings'), type: 'Ring', material: 'Diamond', occasion: 'Engagement,Party', size: '7', stock: 8, featured: 1, image: '/img/products/ring-2.svg' },
            { name: "Mehrab Vintage Band",     description: "Filigree-inspired vintage band with intricate hand-engraved Mughal motifs.",
              price: 32000, category_id: catId('Rings'), type: 'Ring', material: 'Gold', occasion: 'Daily,Wedding', size: '6.5', stock: 15, featured: 0, image: '/img/products/ring-3.svg' },

            // NECKLACES
            { name: "Shahjahan Pendant Necklace",  description: "Delicate teardrop pendant set with a marquise diamond on a fine 18k gold chain.",
              price: 56000, category_id: catId('Necklaces'), type: 'Necklace', material: 'Gold', occasion: 'Party,Wedding', length: '18\"', stock: 10, featured: 1, image: '/img/products/necklace-1.svg' },
            { name: "Layla Pearl Strand",          description: "A single strand of hand-selected freshwater pearls finished with a gold lobster clasp.",
              price: 38000, category_id: catId('Necklaces'), type: 'Necklace', material: 'Pearl', occasion: 'Daily,Party', length: '16\"', stock: 14, featured: 0, image: '/img/products/necklace-2.svg' },
            { name: "Andalusia Statement Choker",  description: "Bold statement choker featuring cascading emeralds and brilliant diamond accents.",
              price: 142000, category_id: catId('Necklaces'), type: 'Necklace', material: 'Emerald', occasion: 'Wedding,Bridal', length: '14\"', stock: 4, featured: 1, image: '/img/products/necklace-3.svg' },

            // EARRINGS
            { name: "Zahra Diamond Studs",     description: "Classic round brilliant diamond studs (0.5ct each) in a four-prong basket setting.",
              price: 48000, category_id: catId('Earrings'), type: 'Earring', material: 'Diamond', occasion: 'Daily,Party', stock: 20, featured: 1, image: '/img/products/earring-1.svg' },
            { name: "Pari Crescent Hoops",     description: "Slim crescent-shaped 18k gold hoops, lightweight and perfect for everyday wear.",
              price: 24000, category_id: catId('Earrings'), type: 'Earring', material: 'Gold', occasion: 'Daily,Party', stock: 18, featured: 0, image: '/img/products/earring-2.svg' },
            { name: "Mehr Chandelier Earrings", description: "Cascading chandelier earrings with kundan and tiny pearl drops — pure bridal elegance.",
              price: 92000, category_id: catId('Earrings'), type: 'Earring', material: 'Kundan', occasion: 'Wedding,Bridal', stock: 6, featured: 1, image: '/img/products/earring-3.svg' },

            // BRACELETS
            { name: "Sahar Tennis Bracelet",   description: "A continuous line of brilliant-cut diamonds in a four-prong setting — the ultimate everyday luxury.",
              price: 88000, category_id: catId('Bracelets'), type: 'Bracelet', material: 'Diamond', occasion: 'Daily,Party', length: '7\"', stock: 7, featured: 1, image: '/img/products/bracelet-1.svg' },
            { name: "Anaya Gold Bangle Set",   description: "Set of two slender 22k gold bangles with hand-textured finish.",
              price: 65000, category_id: catId('Bracelets'), type: 'Bracelet', material: 'Gold', occasion: 'Wedding,Daily', length: '2.6\"', stock: 12, featured: 0, image: '/img/products/bracelet-2.svg' },
            { name: "Inara Charm Bracelet",    description: "Adjustable rose-gold chain bracelet with five hand-set charms.",
              price: 28000, category_id: catId('Bracelets'), type: 'Bracelet', material: 'Rose Gold', occasion: 'Daily', length: '6.5\"', stock: 16, featured: 0, image: '/img/products/bracelet-3.svg' }
        ];

        const insert = db.prepare(`
            INSERT INTO products
                (name, description, price, category_id, type, material, occasion,
                 size, length, stock, image, featured)
            VALUES (@name, @description, @price, @category_id, @type, @material, @occasion,
                    @size, @length, @stock, @image, @featured)
        `);

        for (const p of products) {
            insert.run({
                size:   p.size   || null,
                length: p.length || null,
                ...p
            });
        }
    }
}

module.exports = { seed };

// Allow running as a script: `node data/seed.js`
if (require.main === module) {
    seed();
    console.log('✅ Database seeded successfully');
}
