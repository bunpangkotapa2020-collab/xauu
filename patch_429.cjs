const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Suppress the stack trace for 429
code = code.replace(
    /console\.error\('\[ICT EA\] P\/L Sync Error:', error\);/,
    `if (error.message && error.message.includes('429')) {
            console.warn('[ICT EA] P/L Sync Warning: Rate limited (HTTP 429). Will retry later.');
            // Increase the backoff artificially
            lastPnLSyncTime = Date.now() + 5 * 60 * 1000; 
        } else {
            console.error('[ICT EA] P/L Sync Error:', error.message || error);
        }`
);

// We can also reduce the frequency of syncs
code = code.replace(
    /if \(botState.status === 'running' && \(now - lastPnLSyncTime >= 60000 \|\| !botState\.isDailyPnLSynced\)\) {/g,
    "if (botState.status === 'running' && (now - lastPnLSyncTime >= 120000 || !botState.isDailyPnLSynced)) {"
);

fs.writeFileSync('server.ts', code);
console.log('Patched 429 error logs');
