const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetLogic = `                const totalDailyPnL = botState.realizedDailyPnL + totalFloating;
                const maxLoss = 2000; // FIXED CAP: 2000 USC`;

const newLogic = `                const totalDailyPnL = botState.realizedDailyPnL + totalFloating;
                const maxLoss = botState.riskConfig?.maxDailyLossAmount || botState.riskConfig?.maxDailyLoss || 2000;`;

if (code.includes(targetLogic)) {
    code = code.replace(targetLogic, newLogic);
    fs.writeFileSync('server.ts', code);
    console.log("Patched daily loss successfully");
} else {
    console.log("Target logic not found");
}
