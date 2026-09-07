const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add Health Monitor logic above setInterval
const healthLogic = `
// ==========================================
// 🛡️ DARA M1 EA - BOT HEALTH MONITORING
// ==========================================
const HEALTH_STATE_FILE = path.join(DATA_DIR, 'bot_health.json');
let botHealthShuttingDown = false;
let currentMt5State = 'UNKNOWN'; // 'CONNECTED' | 'LOST' | 'UNKNOWN'

function getHealthState() {
    try {
        if (fs.existsSync(HEALTH_STATE_FILE)) return JSON.parse(fs.readFileSync(HEALTH_STATE_FILE, 'utf8'));
    } catch(e) {}
    return { cleanShutdown: true };
}
function setHealthState(clean) {
    try { fs.writeFileSync(HEALTH_STATE_FILE, JSON.stringify({ cleanShutdown: clean })); } catch(e) {}
}

async function handleBotOffline(reason) {
    if (botHealthShuttingDown) return;
    botHealthShuttingDown = true;
    setHealthState(reason === 'CLEAN');
    const msg = reason === 'CLEAN' 
        ? '🔴 DaRa M1 EA — BOT OFFLINE\\nBot បានឈប់ដំណើរការដោយសុវត្ថិភាព។ សូមពិនិត្យ VPS/PM2។'
        : '🔴 DaRa M1 EA — BOT OFFLINE (CRASH)\\nBot បានឈប់ដំណើរការដោយសារ Error។ សូមពិនិត្យ VPS/PM2 ជាបន្ទាន់។';
    try {
        await sendTelegramRaw(msg, 'BOT_OFFLINE', 0);
        // Add a small delay to ensure network request finishes before process exit
        await new Promise(res => setTimeout(res, 2000));
    } catch(e) {}
}

process.on('SIGINT', async () => { await handleBotOffline('CLEAN'); process.exit(0); });
process.on('SIGTERM', async () => { await handleBotOffline('CLEAN'); process.exit(0); });
process.on('uncaughtException', async (err) => { 
    console.error('UNCAUGHT EXCEPTION:', err);
    await handleBotOffline('CRASH'); 
    process.exit(1); 
});

`;

const startServerTarget = 'startServer();';
code = code.replace(startServerTarget, healthLogic + startServerTarget);

// 2. Modify Boot Alert
const bootTarget = `sendTelegramAlert('BOT STATUS', 'ប្រព័ន្ធត្រូវបាន Restart/Boot', 'សេវាកម្មដំណើរការឡើងវិញដោយជោគជ័យ', 0);`;
const bootReplacement = `const lastHealth = getHealthState();
        if (lastHealth.cleanShutdown) {
            sendTelegramRaw('🟢 DaRa M1 EA — BOT ONLINE\\nBot កំពុងដំណើរការ 24/7', 'BOT_ONLINE', 0);
        } else {
            sendTelegramRaw('🟢 DaRa M1 EA — BOT RESTORED\\nBot បានដំណើរការឡើងវិញបន្ទាប់ពី Crash/Offline។', 'BOT_RESTORED', 0);
        }
        setHealthState(false); // Mark dirty, will be set to true on clean exit`;
code = code.replace(bootTarget, bootReplacement);

// 3. Modify setInterval MT5 Connection Lost logic
const intervalTarget = `const tickAgeMs = Date.now() - (botState.lastTickTime || 0);`;
const intervalReplacement = `
        if (currentMt5State !== 'LOST') {
            currentMt5State = 'LOST';
            sendTelegramRaw('🔴 DaRa M1 — MT5 CONNECTION LOST\\nEA បាត់ការតភ្ជាប់ជាមួយ MT5។', 'MT5_CONN_LOST', 0);
        }
        const tickAgeMs = Date.now() - (botState.lastTickTime || 0);`;
code = code.replace(intervalTarget, intervalReplacement);

const intervalConnectedTarget = `if (!botState.marketDataStatus || botState.marketDataStatus.includes('🔴')) {`;
const intervalConnectedReplacement = `if (currentMt5State === 'LOST') {
            currentMt5State = 'CONNECTED';
            sendTelegramRaw('🟢 DaRa M1 — MT5 CONNECTION RESTORED\\nEA កំពុងភ្ជាប់ទិន្នន័យពី MT5 ឡើងវិញ។', 'MT5_CONN_RESTORED', 0);
        } else if (currentMt5State === 'UNKNOWN') {
            currentMt5State = 'CONNECTED';
        }
        if (!botState.marketDataStatus || botState.marketDataStatus.includes('🔴')) {`;
code = code.replace(intervalConnectedTarget, intervalConnectedReplacement);

fs.writeFileSync('server.ts', code);
console.log('PATCH_HEALTH_APPLIED');
