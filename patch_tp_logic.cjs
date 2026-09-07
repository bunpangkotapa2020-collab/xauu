const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// The place where we send real MT5 orders
content = content.replace(
    'takeProfit: Number(tpPrice.toFixed(2)),',
    'takeProfit: botState.riskConfig?.trailingStopEnabled ? 0 : Number(tpPrice.toFixed(2)), // Virtual TP if trailing'
);

// We need to keep tpPrice in botState.signalDetails so we can read it in the trailing stop logic
// Actually, trade.tp will be 0 from MT5 if we set it to 0. 
// So in manageTrailingSL we can't use trade.tp if it's 0!
// We should store the virtual TP in the trade object.
// But MT5 `botPos.takeProfit` will be 0.
// Let's modify where `botState.openTrades` are created from `positions` to assign the virtual TP if it's 0.
