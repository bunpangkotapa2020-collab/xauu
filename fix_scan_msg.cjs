const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCheck = `            const tickAgeMs = Date.now() - (botState.lastTickTime || 0);
            if (tickAgeMs > 60000) {
                const ageText = botState.lastTickTime ? \`\${Math.floor(tickAgeMs/1000)}s\` : 'No Data';
                botState.marketDataStatus = \`🔴 MARKET DATA STALE (Delay: \${ageText})\`;`;

const newCheck = `            const tickAgeMs = Date.now() - (botState.lastTickTime || 0);
            if (tickAgeMs > 60000) {
                const ageText = botState.lastTickTime ? \`\${Math.floor(tickAgeMs/1000)}s\` : 'No Data';
                botState.marketDataStatus = botState.lastTickTime ? \`🔴 MARKET DATA STALE (Delay: \${ageText})\` : \`🔍 SCANNING FOR LIVE MARKET DATA...\`;`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('server.ts', code);
