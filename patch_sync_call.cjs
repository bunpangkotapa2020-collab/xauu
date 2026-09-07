const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "    if (!botState.account.isConnected) return;",
    "    if (!botState.account.isConnected) return;\n\n    const now = Date.now();\n    if (botState.status === 'running' && (now - lastPnLSyncTime >= 60000 || !botState.isDailyPnLSynced)) {\n        lastPnLSyncTime = now;\n        syncDailyRealizedPnL().catch(console.error);\n    }"
);

fs.writeFileSync('server.ts', code);
