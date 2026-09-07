const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const newErrorThrow = `if (!response.ok) {
                if (response.status === 504 || response.status === 502 || response.status === 503) {
                    console.warn(\`[DaRa M1 EA] P/L Sync Warning: MetaApi Gateway Timeout/Error (\${response.status}). Retrying later.\`);
                    isSyncingPnL = false;
                    return; // Fail gracefully, don't throw to avoid spamming error logs
                }
                throw new Error(\`History API failed: \${response.status}\`);
            }`;

const oldErrorThrow = `if (!response.ok) {
                throw new Error(\`History API failed: \${response.status}\`);
            }`;

content = content.replace(newErrorThrow, oldErrorThrow);

const oldCatch = `if (error.message && error.message.includes('429')) {
                console.warn('[DaRa M1 EA] P/L Sync Warning: Rate limited (HTTP 429). Will retry later.');
                lastPnLSyncTime = Date.now(); 
            } else {
                console.error('[DaRa M1 EA] P/L Sync Error:', error.message || error);
            }`;

const newCatch = `if (error.message && (error.message.includes('429') || error.message.includes('504') || error.message.includes('502') || error.message.includes('503'))) {
                console.warn(\`[DaRa M1 EA] P/L Sync Warning: API Error (\${error.message}). Will retry later.\`);
                lastPnLSyncTime = Date.now(); 
            } else {
                console.error('[DaRa M1 EA] P/L Sync Error:', error.message || error);
            }`;

content = content.replace(oldCatch, newCatch);
fs.writeFileSync('server.ts', content, 'utf8');
console.log('Patched 504 handling in the catch block instead');
