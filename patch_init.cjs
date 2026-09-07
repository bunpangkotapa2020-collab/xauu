const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "  isDailyPnLSynced: false,\n  realizedDailyPnL: 0,\n  currentTradingDate: \"\",",
    "  isDailyPnLSynced: false,\n  realizedDailyPnL: 0,\n  currentTradingDate: initialSavedConfig.currentTradingDate || \"\",\n  dailyLossLimitHit: initialSavedConfig.dailyLossLimitHit || false,"
);

fs.writeFileSync('server.ts', code);
