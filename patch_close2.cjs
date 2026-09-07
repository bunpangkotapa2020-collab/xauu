const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "          botState.openTrades.forEach((oldTrade: any) => {",
    "          let tradeClosed2 = false;\n          botState.openTrades.forEach((oldTrade: any) => {"
);

code = code.replace(
    "              if (!newTradeIds.includes(oldTrade.id)) {\n                  if (oldTrade.floatingProfit < 0) {",
    "              if (!newTradeIds.includes(oldTrade.id)) {\n                  tradeClosed2 = true;\n                  if (oldTrade.floatingProfit < 0) {"
);

code = code.replace(
    "              }\n          });\n      }",
    "              }\n          });\n          if (tradeClosed2) lastPnLSyncTime = 0;\n      }"
);

fs.writeFileSync('server.ts', code);
