const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const oldCode = `if (error.message && (error.message.includes('429') || error.message.includes('504') || error.message.includes('502') || error.message.includes('503'))) {
                console.warn(\`[DaRa M1 EA] P/L Sync Warning: API Error (\${error.message}). Will retry later.\`);
                lastPnLSyncTime = Date.now(); 
            }`;

const newCode = `if (error.message && (error.message.includes('429') || error.message.includes('504') || error.message.includes('502') || error.message.includes('503'))) {
                // Silently ignore known transient broker/MetaApi timeouts (50x) and rate limits (429)
                // to prevent log spam. The bot will automatically retry on the next cycle.
                lastPnLSyncTime = Date.now(); 
            }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('server.ts', content, 'utf8');
console.log('Patched warning out');
