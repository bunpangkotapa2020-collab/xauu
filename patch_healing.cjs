const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importReplacement = `import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
`;
code = code.replace("import dotenv from 'dotenv';", importReplacement);

const engineCode = `
// ==========================================
// SELF-HEALING & AUTO-RECOVERY ENGINE 24/7
// ==========================================
const RECOVERY_LOG_PATH = path.join(DATA_DIR, 'recovery_logs.json');
if (!fs.existsSync(RECOVERY_LOG_PATH)) {
    fs.writeFileSync(RECOVERY_LOG_PATH, JSON.stringify([]));
}

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || '',
        pass: process.env.GMAIL_APP_PASSWORD || ''
    }
});

const SelfHealingEngine = {
    isDisconnected: false,
    disconnectStartTime: 0,
    alertSent: false,
    
    log(event, details) {
        try {
            const history = JSON.parse(fs.readFileSync(RECOVERY_LOG_PATH, 'utf8'));
            history.unshift({ time: new Date().toISOString(), event, details });
            if (history.length > 500) history.pop(); // Keep last 500 logs
            fs.writeFileSync(RECOVERY_LOG_PATH, JSON.stringify(history, null, 2));
            console.log(\`[Self-Healing] \${event}: \${details}\`);
        } catch (err) {
            console.error('Failed to write recovery log', err);
        }
    },

    async sendAlert(subject, text) {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.warn('⚠️ GMAIL_USER or GMAIL_APP_PASSWORD not set. Skipping email alert.');
            return;
        }
        try {
            await mailTransport.sendMail({
                from: process.env.GMAIL_USER,
                to: process.env.GMAIL_USER,
                subject: \`[XAUUSD Bot Alert] \${subject}\`,
                text: text
            });
            this.log('EMAIL_SENT', subject);
        } catch (err) {
            this.log('EMAIL_FAILED', String(err));
        }
    },

    checkConnectionState(isConnected) {
        if (!isConnected) {
            if (!this.isDisconnected) {
                this.isDisconnected = true;
                this.disconnectStartTime = Date.now();
                this.log('DISCONNECTED', 'MT5 Connection lost. Tracking downtime.');
            } else {
                const offlineMinutes = (Date.now() - this.disconnectStartTime) / 60000;
                if (offlineMinutes >= 5 && !this.alertSent) {
                    this.sendAlert('CRITICAL: MT5 Disconnected', \`The bot has been offline for \${offlineMinutes.toFixed(1)} minutes.\\n\\nAuto-recovery is active and attempting to reconnect every 3 seconds.\`);
                    this.alertSent = true;
                }
            }
        } else {
            if (this.isDisconnected) {
                const offlineMinutes = (Date.now() - this.disconnectStartTime) / 60000;
                this.log('RECOVERED', \`MT5 Connection restored after \${offlineMinutes.toFixed(1)} minutes.\`);
                if (this.alertSent) {
                    this.sendAlert('RESOLVED: MT5 Reconnected', \`The bot successfully auto-recovered and reconnected to MT5 after \${offlineMinutes.toFixed(1)} minutes of downtime.\\n\\nAuto Trading resumes normally.\`);
                }
                this.isDisconnected = false;
                this.disconnectStartTime = 0;
                this.alertSent = false;
            }
        }
    },

    registerCrashHandlers() {
        process.on('uncaughtException', (err) => {
            this.log('CRASH', \`Uncaught Exception: \${err.message}\`);
            this.sendAlert('CRASH: Uncaught Exception', \`Bot crashed: \${err.stack}\\n\\nPM2 should auto-restart it shortly.\`).finally(() => {
                process.exit(1);
            });
        });
        process.on('unhandledRejection', (reason, promise) => {
            this.log('CRASH', \`Unhandled Rejection: \${reason}\`);
            this.sendAlert('CRASH: Unhandled Rejection', \`Bot crashed due to unhandled promise rejection: \${reason}\\n\\nPM2 will restart it.\`).finally(() => {
                process.exit(1);
            });
        });
    }
};

SelfHealingEngine.registerCrashHandlers();

// ==========================================
// PERSISTENT OWNER / ADMIN AUTHENTICATION
`;

code = code.replace("// ==========================================\n// PERSISTENT OWNER / ADMIN AUTHENTICATION", engineCode);

fs.writeFileSync('server.ts', code);
console.log('SelfHealingEngine injected.');
