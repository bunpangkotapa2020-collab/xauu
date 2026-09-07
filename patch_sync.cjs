const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const syncCode = `
// ==== DAILY P/L SYNC SYSTEM ====
function getCambodiaMidnightISO() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Phnom_Penh',
        year: 'numeric', month: 'numeric', day: 'numeric'
    });
    const parts = formatter.formatToParts(now);
    let year = '', month = '', day = '';
    for (const p of parts) {
        if (p.type === 'year') year = p.value;
        if (p.type === 'month') month = p.value.padStart(2, '0');
        if (p.type === 'day') day = p.value.padStart(2, '0');
    }
    // Convert to ISO (UTC)
    return new Date(\`\${year}-\${month}-\${day}T00:00:00+07:00\`).toISOString();
}

let isSyncingPnL = false;
let lastPnLSyncTime = 0;

async function syncDailyRealizedPnL() {
    if (isSyncingPnL) return;
    if (!botState.account.serverConnected || !botState.account.metaApiToken || !botState.account.metaApiUrl || !botState.account.metaApiAccountId) return;
    if (botState.status !== 'running') return;

    try {
        isSyncingPnL = true;
        const startTime = getCambodiaMidnightISO();
        const endTime = new Date().toISOString();
        const baseUrl = botState.account.metaApiUrl;
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        
        let allDeals = [];
        let offset = 0;
        const limit = 1000;
        
        while (true) {
            const url = \`\${baseUrl}/users/current/accounts/\${accountId}/history-deals/time/\${startTime}/\${endTime}?offset=\${offset}&limit=\${limit}\`;
            const response = await fetch(url, { headers: { 'auth-token': token } });
            if (!response.ok) {
                throw new Error(\`History API failed: \${response.status}\`);
            }
            const deals = await response.json();
            allDeals = allDeals.concat(deals);
            if (deals.length < limit) break;
            offset += limit;
        }
        
        let dailyRealized = 0;
        for (const deal of allDeals) {
            if (Number(deal.magic) === botState.magicNumber) {
                const profit = Number(deal.profit || 0);
                const commission = Number(deal.commission || 0);
                const swap = Number(deal.swap || 0);
                const fee = Number(deal.fee || 0);
                dailyRealized += (profit + commission + swap + fee);
            }
        }
        
        botState.realizedDailyPnL = dailyRealized;
        botState.isDailyPnLSynced = true;
        botState.currentTradingDate = startTime;
        lastPnLSyncTime = Date.now();
        
    } catch (error) {
        console.error('[NEW EA SMC] P/L Sync Error:', error);
        botState.isDailyPnLSynced = false;
    } finally {
        isSyncingPnL = false;
    }
}
// =================================

// REAL MT5 Polling Loop`;

code = code.replace('// REAL MT5 Polling Loop', syncCode);
fs.writeFileSync('server.ts', code);
