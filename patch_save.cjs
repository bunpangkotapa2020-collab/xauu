const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "      selectedAsset: botState.selectedAsset,",
    "      selectedAsset: botState.selectedAsset,\n      currentTradingDate: botState.currentTradingDate,\n      dailyLossLimitHit: botState.dailyLossLimitHit,"
);

fs.writeFileSync('server.ts', code);
