# 🛠 RIWAQ — Setup Guide (Brand Owner)

This is **a step-by-step checklist** to get your website running with real emails, real PostEx courier, and real payment proof verification.

If you've never used a terminal before, take it slow — every step has been written out. **Total time: ~30 minutes.**

---

## ✅ Step 1: Install Node.js 22 (one-time)

1. Go to https://nodejs.org/
2. Download the **"LTS" version** (must be 22 or higher).
3. Run the installer, click Next on everything.
4. Open a fresh PowerShell/Terminal and verify:
   ```
   node --version
   ```
   Should show `v22.x.x` or higher.

---

## ✅ Step 2: Install Project Dependencies

In your terminal, navigate to the project folder and run:

```bash
cd path/to/riwaq
npm install
```

Wait ~1 minute. You should see "added 82+ packages" at the end.

---

## ✅ Step 3: Create Your .env File

In the project folder, find the file **`.env.example`** and **copy it** to a new file named **`.env`** (without `.example`).

On Windows PowerShell:
```bash
copy .env.example .env
```

On Mac/Linux:
```bash
cp .env.example .env
```

Then open `.env` in **Notepad / VS Code** to fill in the values below.

---

## ✅ Step 4: Set Up Real Email (Gmail)

### 4A. Use a brand Gmail account
If you don't have one yet, create `yourbrandname@gmail.com` at gmail.com.

### 4B. Turn ON 2-Step Verification
1. Sign in to that Gmail
2. Go to: https://myaccount.google.com/security
3. Find **"2-Step Verification"** → click → follow steps to enable

### 4C. Generate an App Password
1. After 2-Step is on, go to: https://myaccount.google.com/apppasswords
2. Under **"Select app"** → choose **Mail**
3. Under **"Select device"** → choose **Other** → type **"RIWAQ Website"**
4. Click **Generate**
5. **Copy the 16-character password** (looks like `abcd efgh ijkl mnop`)

### 4D. Paste into .env
Open `.env` and update these lines:
```
EMAIL_USER=yourbrandname@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=RIWAQ Jewellery
```
(Remove spaces from the app password)

---

## ✅ Step 5: Set Up PostEx COD Integration

1. Log in to your PostEx merchant dashboard: https://postex.pk
2. Find your **API Token** (usually under Settings → Integrations or API)
3. Find your **Pickup Address Code** (under Pickup Addresses)
4. Paste into `.env`:
```
POSTEX_API_TOKEN=your-postex-api-token
POSTEX_PICKUP_ADDRESS_CODE=your-pickup-code
POSTEX_MERCHANT_NAME=RIWAQ Jewellery
```

> 💡 If you don't have these yet, leave them blank. The website will use simulated tracking numbers (`CX-12345...`) for testing — no errors.

---

## ✅ Step 6: Set Up Manual Payment Account Details

Open `.env` and fill in YOUR receiving account details:

```
BANK_NAME=Meezan Bank
BANK_ACCOUNT_TITLE=YOUR Brand Name as Per Bank
BANK_ACCOUNT_NUMBER=01234567890123
BANK_IBAN=PK00MEZN0001234567890123

JAZZCASH_NUMBER=03001234567
JAZZCASH_ACCOUNT_TITLE=YOUR Brand Name

EASYPAISA_NUMBER=03001234567
EASYPAISA_ACCOUNT_TITLE=YOUR Brand Name
```

These are shown to customers when they choose bank/JazzCash/EasyPaisa at checkout.

---

## ✅ Step 7: Set Other Brand Info

```
BRAND_NAME=RIWAQ Jewellery
BRAND_URL=http://localhost:3000          # Change to your real domain after deployment
BRAND_PHONE=+92 300 1234567
BRAND_INSTAGRAM=https://instagram.com/yourbrand
BRAND_SUPPORT_EMAIL=support@yourbrand.pk
```

---

## ✅ Step 8: Start the Server

```bash
npm start
```

You should see:
```
[INFO] 📧 Mailer ready (yourbrandname@gmail.com)
[INFO] 📦 PostEx: configured, real bookings enabled
🌟 RIWAQ server running at http://localhost:3000
```

If you see `📧 Mailer: not set — emails will be logged but NOT sent`, your email vars are missing/wrong.

---

## ✅ Step 9: Test Everything

### Test the customer email flow:
1. Open http://localhost:3000
2. **Register a new account** using **your personal email** (not the brand one — you want to receive the test).
3. Check your inbox — you should get a **Welcome email** within 30 seconds.
4. Add a product to cart, checkout with **COD** → check inbox for **Order Confirmation email** with tracking number.

### Test the bank transfer flow:
1. Add another item → checkout with **Bank Transfer**
2. You'll be redirected to the payment-pending page showing bank details
3. Upload any image as "proof"
4. Log out → log in as admin (`admin@riwaq.pk` / `admin123`)
5. Go to **Verify Payments** → click the order → click **Approve**
6. Customer (your email) gets a "Payment Verified" email

---

## 🚨 Common Issues

**"Mailer verification failed: Invalid login"**
- App password is wrong or has spaces. Re-generate one and paste it WITHOUT spaces.

**"Mailer verification failed: Username and Password not accepted"**
- 2-Step Verification not turned on. Turn it on first.

**Tracking number says `CX-12345678901 (simulated)` even after PostEx setup**
- POSTEX_API_TOKEN or POSTEX_PICKUP_ADDRESS_CODE is missing/wrong. Re-check `.env`.

**`ERR_CONNECTION_REFUSED` in browser**
- Server isn't running. Run `npm start` again in terminal. Don't close the terminal while testing.

**Customer didn't get an email**
- Check spam folder
- Check the server terminal — look for `📧 EMAIL → ... sent successfully` or an error message
- Gmail may temporarily rate-limit during heavy testing — wait a few minutes

---

## 📞 Need help?

The README.md has full architecture documentation. The `/admin/patterns` page in the running app shows every design pattern with file paths.
