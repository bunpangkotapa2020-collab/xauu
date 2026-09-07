const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "  selectedAsset: 'XAUUSD' as const,",
    "  selectedAsset: 'XAUUSD' as const,\n  currentTradingDate: '',\n  dailyLossLimitHit: false,"
);

fs.writeFileSync('server.ts', code);
