const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSettings = `            lotSize: botState.riskConfig.lotSize || 0.01,
            slDistance: botState.riskConfig.minSlPips || 300,
            tpDistance: botState.riskConfig.tpPips || 500,
            dailyLossLimit: botState.riskConfig.dailyLossLimit || 50`;

const newSettings = `            lotSize: botState.riskConfig.lotSize || 0.01,
            slDistance: botState.riskConfig.stopLossPips || 250,
            tpDistance: botState.riskConfig.takeProfitPips || 350,
            dailyLossLimit: botState.riskConfig.maxDailyLossAmount || 50`;

code = code.replace(oldSettings, newSettings);
fs.writeFileSync('server.ts', code);
console.log('patched settings fix');
