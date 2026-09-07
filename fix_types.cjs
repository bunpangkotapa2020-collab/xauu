const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('maxOpenTrades: number')) {
    code = code.replace(
        'trailingStopEnabled: boolean;',
        'trailingStopEnabled: boolean;\n  maxOpenTrades: number;\n  entriesPerSignal: number;\n  maxConsecutiveLosses: number;\n  cooldownMinutes: number;\n  maxDailyLossPercent: number;\n  maxDailyLossAmount: number;'
    );
}

if (!code.includes('openTrades: TradeOrder[]')) {
    code = code.replace(
        'currentTrade: TradeOrder | null;',
        'currentTrade: TradeOrder | null;\n  openTrades: TradeOrder[];\n  consecutiveLosses: number;\n  cooldownUntil: number | null;\n  signalDetails?: { side: string; symbol: string; entry: number; lot: number; sl: number; tp: number; risk: number; count: number; };'
    );
}

fs.writeFileSync('src/types.ts', code);
