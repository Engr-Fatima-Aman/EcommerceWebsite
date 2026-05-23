# 💎 RIWAQ — Premium Jewellery E-Commerce Platform

**Software Design & Architecture Lab Project + Production Brand Website**
**Bahria University Karachi — BSE-4 (A/B) — 2026**

A fully-functional luxury jewellery e-commerce platform demonstrating MVC architecture and six classic GoF design patterns — wired with real production integrations (Gmail email, PostEx courier, payment-proof verification).

---

## 👩‍💻 Team

| Member | Role |
| --- | --- |
| **Fatima Aman** (Lead) | Products module, Search, Factory Method, Strategy |
| **Nukhba Tehreem** | Auth, Cart, Wishlist, Singleton, Repository |
| **Mariah Akber** | Checkout, Orders, Admin Dashboard, Observer, Decorator |

**Course:** SEL-457 Software Design Architecture
**Instructor:** Ms. Tooba Shaikh
**Lab Instructor:** Engr. Sohaib Naseem

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in your secrets
cp .env.example .env
# Then open .env in any text editor and fill in:
#   - EMAIL_USER / EMAIL_PASSWORD  (Gmail app password)
#   - POSTEX_API_TOKEN              (from your PostEx dashboard)
#   - BANK_NAME, BANK_ACCOUNT_NUMBER, JAZZCASH_NUMBER, etc.

# 3. Start the server
npm start

# 4. Open in browser
#    Customer site:  http://localhost:3000
#    Admin panel:    http://localhost:3000/admin/login
```

### Default Credentials

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@riwaq.pk` | `admin123` |
| **Customer (demo)** | `fatima@example.com` | `customer123` |

### Node Requirements
Node.js **22.5+** (uses built-in `node:sqlite` — no native compilation).

---

## 🔧 Setting Up Real Integrations

### 📧 Real Email (Gmail SMTP)

1. Use any Gmail account (ideally a brand-dedicated one, e.g. `riwaqjewellery@gmail.com`).
2. Turn ON 2-Step Verification: https://myaccount.google.com/security
3. Create an App Password: https://myaccount.google.com/apppasswords
   - "Select app": Mail
   - "Select device": Other → name it "RIWAQ Website"
   - You'll get a 16-character password — copy it.
4. Open `.env` and fill:
   ```
   EMAIL_USER=yourbrand@gmail.com
   EMAIL_PASSWORD=the16charpasswordhere
   ```
5. Restart server. At boot you should see `📧 Mailer ready (yourbrand@gmail.com)` in the console.

If credentials are missing, the app still runs — emails are just logged to console instead of being sent. Safe for development.

### 🚚 PostEx Courier (COD auto-booking)

1. Sign up at https://postex.pk as a merchant (you said you already have this).
2. From your PostEx merchant dashboard, get your **API Token** and **Pickup Address Code**.
3. Open `.env` and fill:
   ```
   POSTEX_API_TOKEN=your-token-here
   POSTEX_PICKUP_ADDRESS_CODE=your-pickup-code
   POSTEX_MERCHANT_NAME=RIWAQ Jewellery
   ```
4. When a customer places a COD order, PostEx is called automatically and a tracking number is generated, shown to the customer, and emailed.

If PostEx isn't configured, the app generates simulated `CX-...` tracking numbers — safe for testing.

### 💳 Manual Payment Methods (Bank / JazzCash / EasyPaisa)

These don't need any API — just put your receiving account details in `.env`:

```
BANK_NAME=Meezan Bank
BANK_ACCOUNT_TITLE=RIWAQ Jewellery
BANK_ACCOUNT_NUMBER=01234567890123
BANK_IBAN=PK00MEZN0001234567890123

JAZZCASH_NUMBER=03001234567
EASYPAISA_NUMBER=03001234567
```

The flow:
1. Customer places order → sees your account details → transfers money
2. Customer uploads payment screenshot on the order page
3. Admin sees the proof in **Admin → Verify Payments**
4. Admin approves → order moves to "Processing" → PostEx auto-books courier → customer gets email

---

## 🧱 Architecture: MVC

```
┌─────────────────────────────────────────────────────────────┐
│                         VIEWS (EJS)                          │
│   /views/customer/*.ejs      /views/admin/*.ejs              │
└──────────────────────┬──────────────────────────────────────┘
                       │ renders
┌──────────────────────▼──────────────────────────────────────┐
│                     CONTROLLERS                              │
│   /controllers/{auth,product,cart,order,wishlist,admin}.js   │
└──────────────────────┬──────────────────────────────────────┘
                       │ uses
┌──────────────────────▼──────────────────────────────────────┐
│            MODEL LAYER (Repository Pattern)                  │
│   /patterns/repository/{Base,Product,User,Order,Category}.js │
└──────────────────────┬──────────────────────────────────────┘
                       │ talks to
┌──────────────────────▼──────────────────────────────────────┐
│       SQLite (via DatabaseManager Singleton)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design Patterns — Where to Find Them

| # | Pattern | Type | File path |
| - | --- | --- | --- |
| 1 | **Singleton** | Creational | `patterns/singleton/{ConfigManager,Logger,DatabaseManager}.js`, `lib/mailer.js`, `lib/postex.js` |
| 2 | **Factory Method** | Creational | `patterns/factory/{ProductFactory,PaymentFactory}.js` |
| 3 | **Observer** | Behavioural | `patterns/observer/OrderObservers.js` |
| 4 | **Strategy** | Behavioural | `patterns/strategy/DiscountStrategy.js` |
| 5 | **Decorator** | Structural | `patterns/decorator/ProductDecorator.js` |
| 6 | **Repository** | Architectural | `patterns/repository/*.js` |

> 📌 **Demo page for evaluation:** Sign in as admin and open **`/admin/patterns`**.

### Observers (the most extended pattern)

| Observer | Real / Stubbed | Purpose |
| --- | --- | --- |
| `EmailNotifier` | **REAL** | Sends order confirmation / status / verified emails via Gmail SMTP |
| `SMSNotifier` | Stubbed | Logs to console (paid SMS gateway integration future) |
| `AdminDashboardNotifier` | Stubbed | Server log only (real-time SSE/WebSocket future) |
| `InventoryUpdater` | **REAL** | Actually decrements stock on placement, restores on cancel |
| `PostExCourierBooker` | **REAL** | Books COD orders with PostEx API, returns tracking number |

This is the key strength of the Observer pattern in this codebase: **real and stubbed observers coexist without the OrderSubject knowing or caring which is which.** Swapping `SMSNotifier` from stub to real (e.g. via Twilio) tomorrow requires changing only one class.

---

## 📁 Project Structure

```
riwaq/
├── server.js                       # Entry point (loads dotenv first)
├── package.json
├── .env.example                    # Template — copy to .env
├── .env                            # Your secrets (gitignored)
├── .gitignore
├── README.md
├── lib/                            # Production integration libraries
│   ├── mailer.js                   # Nodemailer (Gmail SMTP) singleton
│   ├── emailTemplates.js           # Branded HTML email templates
│   └── postex.js                   # PostEx API client
├── controllers/                    # MVC Controllers
│   ├── adminController.js
│   ├── authController.js
│   ├── cartController.js
│   ├── orderController.js          # Async — handles payment flow split
│   ├── productController.js
│   └── wishlistController.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── adminRoutes.js
│   └── customerRoutes.js           # Includes multer for proof upload
├── patterns/                       # ⭐ Design pattern implementations
│   ├── singleton/
│   ├── factory/
│   ├── observer/                   # 5 observers (3 real, 2 stubbed)
│   ├── strategy/
│   ├── decorator/
│   └── repository/
├── data/
│   ├── initSchema.js               # Tables + migrations
│   ├── seed.js
│   ├── generate-images.js
│   └── riwaq.db                    # Auto-created
├── public/
│   ├── css/{style,admin}.css
│   ├── js/main.js
│   ├── img/                        # Hero, logo, product SVGs
│   └── uploads/                    # Payment proof screenshots (gitignored)
└── views/
    ├── layouts/{customer,admin}.ejs
    ├── partials/product-card.ejs
    ├── customer/                   # 13 pages (incl. payment-pending)
    └── admin/                      # 9 pages (incl. payments)
```

---

## 🧪 Demo Flow for Evaluation

### Lab demo (patterns):
1. **Sign in** as customer (`fatima@example.com` / `customer123`).
2. **Open product page** → tick **Gift Wrap, Engraving, Premium Box, Express** → Add to Cart.
3. **Cart** → apply coupon `NEWYEAR20` → 20% off.
4. **Checkout** → COD → confirmation page **lists 5 observers that fired** + shows PostEx tracking number.
5. **Admin → Patterns** — full pattern documentation.

### Brand/production demo (real flows):
1. **Customer places COD order** → tracking number auto-generated by PostEx → emailed to customer.
2. **Customer places Bank Transfer order** → sees account details → uploads screenshot → admin verifies in **Admin → Verify Payments** → email + courier booking auto-fire.
3. **Admin changes status** to "Shipped" → customer receives styled HTML email update.

---

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 22 (`node:sqlite` built-in) |
| HTTP | Express 4 |
| Views | EJS + express-ejs-layouts |
| Database | SQLite |
| Auth | bcryptjs + express-session |
| Email | Nodemailer (Gmail SMTP) |
| Courier | PostEx Merchant API |
| File upload | Multer |
| Config | dotenv |
| Styling | Bootstrap 5 + custom CSS |

---

## 🔒 What's Still Coming (Phase B)

Phase A (this version) gives you a brand-ready website. Phase B will add:
- **XPay by PostEx** integration (cards + wallets via single API, automated)
- **Image upload for admin** product management
- **Persistent session store** (sessions survive restarts)
- **Rate limiting** (login brute-force protection)
- **Production deployment** (Railway/Render + domain + Google Search Console)
- **Real SMS gateway** (Jazz BulkSMS or BulkSMS PK)

---

## 📜 License

MIT — built as coursework and brand foundation.

<p align="center">
  <strong>RIWAQ</strong> — <em>Where every piece tells a timeless story.</em><br>
  Crafted with care in Karachi, Pakistan 🇵🇰
</p>
