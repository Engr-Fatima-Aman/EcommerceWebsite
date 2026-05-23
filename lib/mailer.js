/**
 * ============================================================
 *  Mailer (Singleton Pattern — extension of our Singleton design)
 * ============================================================
 *  Wraps Nodemailer with a single transporter instance.
 *  All email sending across the app routes through this module.
 *
 *  PRODUCTION USAGE:
 *  Set EMAIL_USER + EMAIL_PASSWORD in .env (Gmail App Password).
 *  If credentials are missing, mail attempts are logged but
 *  not sent — keeps dev environment safe.
 * ============================================================
 */

const nodemailer = require('nodemailer');
const Logger = require('../patterns/singleton/Logger');

class Mailer {
    static #instance = null;
    constructor() {
        if (Mailer.#instance) {
            throw new Error('Mailer is a Singleton — use Mailer.getInstance()');
        }
        this.transporter = null;
        this.ready = false;
        this.#init();
        Mailer.#instance = this;
    }

    static getInstance() {
        if (!Mailer.#instance) new Mailer();
        return Mailer.#instance;
    }

    #init() {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASSWORD;

        if (!user || !pass) {
            Logger.getInstance().info('📧 Mailer: EMAIL_USER/EMAIL_PASSWORD not set — emails will be logged but NOT sent (dev mode)');
            this.ready = false;
            return;
        }

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });

        // Verify connection at boot (non-blocking)
        this.transporter.verify((err) => {
            if (err) {
                Logger.getInstance().error(`📧 Mailer verification failed: ${err.message}`);
                this.ready = false;
            } else {
                Logger.getInstance().info(`📧 Mailer ready (${user})`);
                this.ready = true;
            }
        });

        this.ready = true; // Optimistic — final state set by verify callback
    }

    /**
     * Send email. Returns { sent, error }.
     */
    async send({ to, subject, html, text }) {
        const fromName = process.env.EMAIL_FROM_NAME || 'RIWAQ Jewellery';
        const fromEmail = process.env.EMAIL_USER || 'noreply@riwaq.local';

        if (!this.transporter) {
            Logger.getInstance().info(`📧 [DEV] Would send to ${to}: "${subject}"`);
            return { sent: false, error: 'Mailer not configured (set EMAIL_USER/EMAIL_PASSWORD)' };
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to,
                subject,
                text: text || subject,
                html
            });
            Logger.getInstance().info(`📧 Email sent to ${to} (id: ${info.messageId})`);
            return { sent: true, messageId: info.messageId };
        } catch (err) {
            Logger.getInstance().error(`📧 Email send failed to ${to}: ${err.message}`);
            return { sent: false, error: err.message };
        }
    }
}

module.exports = Mailer;
