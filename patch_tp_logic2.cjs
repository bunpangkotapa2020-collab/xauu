const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Send 0 to MT5 if trailingStopEnabled
content = content.replace(
    'takeProfit: Number(tpPrice.toFixed(2)),',
    'takeProfit: botState.riskConfig?.trailingStopEnabled ? 0 : Number(tpPrice.toFixed(2)),'
);

// 2. In manageTrailingSL, if trade.tp is 0, we can calculate virtual TP on the fly!
// We know virtual TP is at RR 1:2.4
// riskDistance = Math.abs(trade.entryPrice - trade.sl)
// virtualTpDistance = riskDistance * 2.4
// virtualTp = (BUY) ? entryPrice + virtualTpDistance : entryPrice - virtualTpDistance;

content = content.replace(
    'const tpDistance = Math.abs((trade.tp || trade.entryPrice) - trade.entryPrice);',
    `const virtualTpDistance = riskDistance * 2.4;
        const virtualTp = trade.side === 'BUY' ? trade.entryPrice + virtualTpDistance : trade.entryPrice - virtualTpDistance;
        const targetTp = trade.tp > 0 ? trade.tp : virtualTp;`
);

content = content.replace(
    'if (activePrice >= (trade.tp || trade.entryPrice) && trade.tp > 0)',
    'if (activePrice >= targetTp)'
);
content = content.replace(
    'if (activePrice <= (trade.tp || trade.entryPrice) && trade.tp > 0)',
    'if (activePrice <= targetTp)'
);

fs.writeFileSync('server.ts', content);
console.log('patched tp logic');
