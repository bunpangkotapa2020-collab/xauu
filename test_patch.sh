cat << 'PATCH_EOF' > /tmp/patch_429.cjs
const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Use a flag to indicate backoff
code = code.replace(
    /let isSyncingPnL = false;\nlet lastPnLSyncTime = 0;/g,
    \`let isSyncingPnL = false;\nlet lastPnLSyncTime = 0;\nlet pnlSyncBackoff = 0;\`
);

// Suppress the stack trace for 429
code = code.replace(
    /console\.error\('\\[ICT EA\\] P\\/L Sync Error:', error\);/,
    \`if (error.message && error.message.includes('429')) {
            console.warn('[ICT EA] P/L Sync Warning: Rate limited (HTTP 429). Will retry later.');
            pnlSyncBackoff = 5 * 60 * 1000; 
        } else {
            console.error('[ICT EA] P/L Sync Error:', error.message || error);
        }\`
);

code = code.replace(
    /lastPnLSyncTime = Date.now\(\);(\s+isSyncingPnL = false;)/g,
    \`lastPnLSyncTime = Date.now() + (typeof pnlSyncBackoff !== 'undefined' ? pnlSyncBackoff : 0); pnlSyncBackoff = 0;$1\`
);

code = code.replace(
    /if \\(botState.status === 'running' && \\(now - lastPnLSyncTime >= 60000 \\|\\| !botState\\.isDailyPnLSynced\\)\\) {/g,
    "if (botState.status === 'running' && (now - lastPnLSyncTime >= 120000 || !botState.isDailyPnLSynced)) {"
);

fs.writeFileSync('server.ts', code);
console.log('Patched 429 error logs');
PATCH_EOF
node /tmp/patch_429.cjs
