const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix 1: Freshness Check in polling loop
const oldCheck1 = `            // Freshness Check: If last tick is older than 60 seconds, mark STALE
            const tickAgeMs = Date.now() - (botState.lastTickTime || 0);
            if (tickAgeMs > 60000) {
                botState.marketDataStatus = \`🔴 MARKET DATA STALE (TICK DELAY > 60s) (Update: \${Math.floor(tickAgeMs/1000)}s)\`;`;

const newCheck1 = `            // Freshness Check: If last tick is older than 60 seconds, mark STALE
            const tickAgeMs = Date.now() - (botState.lastTickTime || 0);
            if (tickAgeMs > 60000) {
                const ageText = botState.lastTickTime ? \`\${Math.floor(tickAgeMs/1000)}s\` : 'No Data';
                botState.marketDataStatus = \`🔴 MARKET DATA STALE (Delay: \${ageText})\`;`;

code = code.replace(oldCheck1, newCheck1);

// Fix 2: Watchdog
const oldCheck2 = `        botState.account.marketDataReceiving = false;
        const tickAgeMs = Date.now() - (botState.lastTickTime || 0);
        botState.marketDataStatus = \`🔴 MT5 DATA DISCONNECTED (Update: \${Math.floor(tickAgeMs/1000)}s)\`;`;

const newCheck2 = `        botState.account.marketDataReceiving = false;
        const tickAgeMs = Date.now() - (botState.lastTickTime || 0);
        const ageText = botState.lastTickTime ? \`\${Math.floor(tickAgeMs/1000)}s\` : 'No Data';
        botState.marketDataStatus = \`🔴 MT5 DATA DISCONNECTED (Delay: \${ageText})\`;`;

code = code.replace(oldCheck2, newCheck2);

fs.writeFileSync('server.ts', code);
