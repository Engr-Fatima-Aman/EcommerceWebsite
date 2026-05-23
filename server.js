/**
 * ============================================================
 *  RIWAQ — Premium Jewellery E-Commerce Platform
 *  Software Design & Architecture Lab Project
 *  Bahria University Karachi — BSE-4 (A/B) — 2026
 *
 *  Architecture:  MVC (Model–View–Controller)
 *  Patterns:      Singleton, Factory Method, Observer,
 *                 Strategy, Decorator, Repository
 *
 *  Entry point: server.js
 * ============================================================
 */

// Load environment variables FIRST (before any other module reads process.env)
require('dotenv').config();

const express        = require('express');
const session        = require('express-session');
const bodyParser     = require('body-parser');
const path           = require('path');
const fs             = require('fs');
const expressLayouts = require('express-ejs-layouts');

const ConfigManager   = require('./patterns/singleton/ConfigManager');
const Logger          = require('./patterns/singleton/Logger');
const DatabaseManager = require('./patterns/singleton/DatabaseManager');
const Mailer          = require('./lib/mailer');
const PostEx          = require('./lib/postex');
const { seed }        = require('./data/seed');
const { attachLocals } = require('./middleware/auth');

// Initialise singletons + DB schema + seed data
const config = ConfigManager.getInstance();
const logger = Logger.getInstance();
DatabaseManager.getInstance();        // opens the SQLite connection
seed();                                // creates tables + sample data if empty
Mailer.getInstance();                  // verify SMTP at boot
PostEx.getInstance();                  // log PostEx configuration state

// Ensure uploads directory exists (for payment proofs)
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3000;

// ----- View engine -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/customer');

// ----- Middleware -----
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || config.get('sessionSecret'),
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Expose user + cart count + config to every view
app.use(attachLocals);
app.use((req, res, next) => {
    res.locals.config = config.getAll();
    next();
});

// ----- Routes -----
app.use('/admin', require('./routes/adminRoutes'));
app.use('/',      require('./routes/customerRoutes'));

// 404
app.use((req, res) => {
    res.status(404).render('customer/404', { layout: 'layouts/customer' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.stack}`);
    res.status(500).send('Internal Server Error: ' + err.message);
});

app.listen(PORT, () => {
    logger.info(`🌟 RIWAQ server running at http://localhost:${PORT}`);
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║   RIWAQ — Premium Jewellery E-Commerce Platform           ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║   Customer site:  http://localhost:${PORT}                    ║`);
    console.log(`║   Admin panel:    http://localhost:${PORT}/admin/login        ║`);
    console.log(`║                                                            ║`);
    console.log(`║   Admin login:    admin@riwaq.pk    /  admin123            ║`);
    console.log(`║   Customer demo:  fatima@example.com /  customer123        ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);
});
