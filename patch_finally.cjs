const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Use a flag to indicate backoff
code = code.replace(
    /let isSyncingPnL = false;\nlet lastPnLSyncTime = 0;/g,
    `let isSyncingPnL = false;\nlet lastPnLSyncTime = 0;\nlet pnlSyncBackoff = 0;`
);

code = code.replace(
    /lastPnLSyncTime = Date.now\(\) \+ 5 \* 60 \* 1000;/g,
    `pnlSyncBackoff = 5 * 60 * 1000;`
);

code = code.replace(
    /lastPnLSyncTime = Date.now\(\);(\s+isSyncingPnL = false;)/g,
    `lastPnLSyncTime = Date.now() + (typeof pnlSyncBackoff !== 'undefined' ? pnlSyncBackoff : 0); pnlSyncBackoff = 0;$1`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed finally block');
