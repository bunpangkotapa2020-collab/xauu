const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// 1. Remove pnlSyncBackoff initialization
code = code.replace(/let pnlSyncBackoff = 0;\n/g, '');
code = code.replace(/let pnlSyncBackoff = 0;/g, '');

// 2. Remove pnlSyncBackoff assignment
code = code.replace(/pnlSyncBackoff = 5 \* 60 \* 1000;/g, '// No backoff applied to preserve Risk Guard\n            lastPnLSyncTime = Date.now();');

// 3. Revert lastPnLSyncTime assignment in finally block
code = code.replace(/lastPnLSyncTime = Date\.now\(\) \+ \(typeof pnlSyncBackoff !== 'undefined' \? pnlSyncBackoff : 0\); pnlSyncBackoff = 0;/g, 'lastPnLSyncTime = Date.now();');

// 4. Revert 120000 back to 60000
code = code.replace(/now - lastPnLSyncTime >= 120000/g, 'now - lastPnLSyncTime >= 60000');

fs.writeFileSync('server.ts', code);
console.log('Restored safe 60s interval and removed backoff');
