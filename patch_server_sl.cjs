const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetLine = "ictEaEngine.config.lotSize = Number(botState.riskConfig?.lotSize || 0.01);";
if (code.includes(targetLine) && !code.includes("ictEaEngine.config.stopLossDistance")) {
    code = code.replace(targetLine, targetLine + "\n        ictEaEngine.config.stopLossDistance = Number(botState.riskConfig?.stopLossPips || 10);\n        ictEaEngine.config.takeProfitDistance = Number(botState.riskConfig?.takeProfitPips || 10);");
}

const ictConfigLine = "lotSize: 0.01,";
if (code.includes(ictConfigLine) && !code.includes("stopLossDistance:")) {
    code = code.replace(ictConfigLine, ictConfigLine + "\n    stopLossDistance: 10,\n    takeProfitDistance: 10,");
}


fs.writeFileSync('server.ts', code);
