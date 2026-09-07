const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Ensure RiskConfig has new fields in initial state
code = code.replace(/maxDrawdownPercent:\s*5,\s*maxSpreadPoints:\s*30,\s*lotSize:\s*0\.01,/, 'maxDrawdownPercent: 5,\n    maxSpreadPoints: 30,\n    lotSize: 0.01,\n    maxOpenTrades: 4,\n    entriesPerSignal: 1,\n    maxConsecutiveLosses: 3,\n    cooldownMinutes: 15,\n    maxDailyLossPercent: 5,\n    maxDailyLossAmount: 50,');

// Ensure BotState has new fields
code = code.replace(/currentTrade:\s*null,\s*manualTrades:\s*\[\],/, 'currentTrade: null,\n  openTrades: [],\n  consecutiveLosses: 0,\n  cooldownUntil: null,\n  signalDetails: undefined,\n  manualTrades: [],');

fs.writeFileSync('server.ts', code);
