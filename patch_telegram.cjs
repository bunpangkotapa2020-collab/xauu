const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

let envEx = fs.readFileSync('.env.example', 'utf8');
if (!envEx.includes('TELEGRAM_BOT_TOKEN')) {
    envEx += '\n# Telegram Notification Settings\nTELEGRAM_BOT_TOKEN=\nTELEGRAM_CHAT_ID=\n';
    fs.writeFileSync('.env.example', envEx);
}

const telegramLogic = `
// ============================================
// TELEGRAM NOTIFICATION LAYER (READ-ONLY)
// ============================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const alertCooldowns: Record<string, number> = {};

export async function sendTelegramAlert(category: string, issue: string, action: string = '', cooldownMinutes: number = 5) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    
    const now = Date.now();
    const alertKey = \`\${category}_\${issue}\`;
    const lastSent = alertCooldowns[alertKey] || 0;
    
    if (now - lastSent < cooldownMinutes * 60 * 1000) {
        return; // Throttled / Deduplication
    }
    
    alertCooldowns[alertKey] = now;
    
    const statusMap: any = {
        'running': 'RUNNING',
        'paused': 'PAUSED',
        'stopped': 'STOPPED',
        'daily_limit_hit': 'DAILY LIMIT HIT'
    };
    const currentStatus = statusMap[botState.status] || botState.status.toUpperCase();
    
    let header = '🤖 XAUUSD AI Scalping Bot';
    if (category === 'CRITICAL ERROR' || category === 'MT5 CONNECTION LOST' || category === 'ORDER REJECTED') {
        header += '\\n🔴 ' + category;
    } else if (category === 'NEW ENTRY BLOCKED' || category === 'DAILY P/L SYNC ERROR') {
        header += '\\n⚠️ ' + category;
    } else if (category === 'SYSTEM RECOVERED' || category === 'BOT STATUS') {
        header += '\\n🟢 ' + category;
    } else {
        header += '\\nℹ️ ' + category;
    }

    const tzTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh', hour12: false });
    
    let message = \`\${header}\\n\\nIssue: \${issue}\\n\`;
    if (action) message += \`Action: \${action}\\n\`;
    message += \`Time: \${tzTime} (ICT)\\nBot Status: \${currentStatus}\`;

    try {
        fetch(\`https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendMessage\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
        }).catch(err => {
            console.error('Telegram Fetch Error:', err.message);
        });
    } catch (err) {
        console.error('Telegram Alert Error:', err);
    }
}

let prevServerConnected = true;
let prevPnLSynced = true;
let prevDailyLossHit = false;

function monitorSystemTransitions() {
    if (prevServerConnected && !botState.account.serverConnected) {
        sendTelegramAlert('MT5 CONNECTION LOST', 'Disconnected from MetaApi/MT5 Server', 'NEW ENTRIES BLOCKED', 10);
    } else if (!prevServerConnected && botState.account.serverConnected) {
        sendTelegramAlert('SYSTEM RECOVERED', 'MT5 Connection Restored', 'Ready to Trade', 0);
    }
    prevServerConnected = !!botState.account.serverConnected;

    if (prevPnLSynced && !botState.isDailyPnLSynced) {
        if (botState.account.serverConnected) {
            sendTelegramAlert('DAILY P/L SYNC ERROR', 'Failed to sync history deals', 'Risk Check Blocked (Safe Mode)', 10);
        }
    } else if (!prevPnLSynced && botState.isDailyPnLSynced) {
        sendTelegramAlert('SYSTEM RECOVERED', 'Daily P/L Synced Successfully', 'Risk Check Active', 0);
    }
    prevPnLSynced = !!botState.isDailyPnLSynced;

    if (!prevDailyLossHit && botState.dailyLossLimitHit) {
        sendTelegramAlert('NEW ENTRY BLOCKED', 'Daily Loss Limit Hit', 'STOP NEW ENTRIES', 60);
    }
    prevDailyLossHit = !!botState.dailyLossLimitHit;
}
// ============================================

`;

code = code.replace(
    "const app = express();",
    telegramLogic + "const app = express();"
);

code = code.replace(
    "setInterval(async () => {\n    if (!botState.account.isConnected) return;",
    "setInterval(async () => {\n    monitorSystemTransitions();\n    if (!botState.account.isConnected) return;"
);

code = code.replace(
    "botState.statusMessageKhmer = `🔴 [ERROR] MT5 Rejected Order: ${res.status}`;",
    "botState.statusMessageKhmer = `🔴 [ERROR] MT5 Rejected Order: ${res.status}`;\n                 sendTelegramAlert('ORDER REJECTED', `MT5 Rejected Order: ${res.status}`, errText, 1);"
);

code = code.replace(
    "botState.statusMessageKhmer = `🔴 [ERROR] API Connection Failed`;",
    "botState.statusMessageKhmer = `🔴 [ERROR] API Connection Failed`;\n             sendTelegramAlert('CRITICAL ERROR', 'API CONNECTION ERROR DURING ORDER', err.message, 1);"
);

code = code.replace(
    "resetEASetup(`SAFETY_GATE_${safetyReason}`);",
    "resetEASetup(`SAFETY_GATE_${safetyReason}`);\n              sendTelegramAlert('NEW ENTRY BLOCKED', `Safety Gate Triggered: ${safetyReason}`, 'Trade Blocked', 5);"
);

code = code.replace(
    "botState.status = 'running';\n      botState.currentCycle = botState.currentCycle || 1;",
    "botState.status = 'running';\n      botState.currentCycle = botState.currentCycle || 1;\n      sendTelegramAlert('BOT STATUS', 'Bot Started manually', 'Trading Engine Active', 0);"
);

code = code.replace(
    "botState.status = 'paused';\n      botState.statusMessageKhmer = '⏸️ Bot ត្រូវបានផ្អាក (Paused) — មិនបើក Order ថ្មីឡើយ';",
    "botState.status = 'paused';\n      botState.statusMessageKhmer = '⏸️ Bot ត្រូវបានផ្អាក (Paused) — មិនបើក Order ថ្មីឡើយ';\n      sendTelegramAlert('BOT STATUS', 'Bot Paused manually', 'Trading Engine Paused', 0);"
);

code = code.replace(
    "botState.status = 'stopped';\n      botState.signals = { gold: 'WAIT' };",
    "botState.status = 'stopped';\n      botState.signals = { gold: 'WAIT' };\n      sendTelegramAlert('BOT STATUS', 'Bot Stopped manually', 'Trading Engine Stopped', 0);"
);

code = code.replace(
    "const closedCount = (botState.openTrades || []).length;",
    "const closedCount = (botState.openTrades || []).length;\n        sendTelegramAlert('BOT STATUS', 'All Bot Trades Closed Manually', `Closed ${closedCount} trades`, 0);"
);

fs.writeFileSync('server.ts', code);
