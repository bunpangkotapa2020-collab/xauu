const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'trailingStopEnabled: true,',
  'trailingStopEnabled: true,\n    maxOpenTrades: 4,\n    entriesPerSignal: 1,\n    maxConsecutiveLosses: 3,\n    cooldownMinutes: 15,\n    maxDailyLossPercent: 5,\n    maxDailyLossAmount: 50,'
);

code = code.replace(
  'currentTrade: null,',
  'currentTrade: null,\n  openTrades: [],\n  consecutiveLosses: 0,\n  cooldownUntil: null,'
);

fs.writeFileSync('src/App.tsx', code);
