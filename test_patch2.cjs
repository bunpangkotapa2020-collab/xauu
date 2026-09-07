const fs = require('fs');
let code = `let isSyncingPnL = false;
let lastPnLSyncTime = 0;`;

code = code.replace(
    /let isSyncingPnL = false;\s*let lastPnLSyncTime = 0;/g,
    "let isSyncingPnL = false;\nlet lastPnLSyncTime = 0;\nlet pnlSyncBackoff = 0;"
);
console.log(code);
