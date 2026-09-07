const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace("botState.riskConfig?.maxTrades || 10", "botState.riskConfig?.maxOpenTrades || 10");
fs.writeFileSync('server.ts', code);
