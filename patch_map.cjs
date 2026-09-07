const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "floatingProfit: botPos.profit,",
    "floatingProfit: botPos.profit,\n                    commission: botPos.commission || 0,\n                    swap: botPos.swap || 0,"
);

code = code.replace(
    "floatingProfit: Number(botPos.profit || 0),",
    "floatingProfit: Number(botPos.profit || 0),\n        commission: Number(botPos.commission || 0),\n        swap: Number(botPos.swap || 0),"
);

fs.writeFileSync('server.ts', code);
