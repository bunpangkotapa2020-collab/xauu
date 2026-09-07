const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "                    botState.openTrades.forEach((oldTrade: any) => {",
    "                    let tradeClosed = false;\n                    botState.openTrades.forEach((oldTrade: any) => {"
);

code = code.replace(
    "                        if (!newTradeIds.includes(oldTrade.id)) {",
    "                        if (!newTradeIds.includes(oldTrade.id)) {\n                            tradeClosed = true;"
);

code = code.replace(
    "                    });\n                }",
    "                    });\n                    if (tradeClosed) lastPnLSyncTime = 0; // Force sync\n                }"
);

fs.writeFileSync('server.ts', code);
