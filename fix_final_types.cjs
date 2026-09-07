const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix duplicate manualTrades
const firstManualTrade = code.indexOf('manualTrades: any[];');
if (firstManualTrade > -1) {
    const secondManualTrade = code.indexOf('manualTrades: any[];', firstManualTrade + 1);
    if (secondManualTrade > -1) {
        code = code.substring(0, secondManualTrade) + code.substring(secondManualTrade + 'manualTrades: any[];\n'.length);
    }
}

// Add consecutiveLosses and cooldownUntil to BotServerState interface
const interfaceEnd = code.indexOf('}', code.indexOf('interface BotServerState {'));
if (interfaceEnd > -1) {
    let interfaceCode = code.substring(code.indexOf('interface BotServerState {'), interfaceEnd);
    if (!interfaceCode.includes('consecutiveLosses?: number;')) {
        const lastBrace = interfaceCode.lastIndexOf('}');
        interfaceCode = interfaceCode + '  consecutiveLosses?: number;\n  cooldownUntil?: number | null;\n';
        code = code.substring(0, code.indexOf('interface BotServerState {')) + interfaceCode + code.substring(interfaceEnd);
    }
}

// Fix DEFAULT_BOT_CONFIG.riskConfig
const defaultConfigIndex = code.indexOf('const DEFAULT_BOT_CONFIG');
if (defaultConfigIndex > -1) {
    const riskConfigStart = code.indexOf('riskConfig: {', defaultConfigIndex);
    const riskConfigEnd = code.indexOf('},', riskConfigStart);
    if (riskConfigStart > -1 && riskConfigEnd > -1) {
        let riskConfigStr = code.substring(riskConfigStart, riskConfigEnd);
        if (!riskConfigStr.includes('maxOpenTrades:')) {
            riskConfigStr = riskConfigStr.replace('trailingStopEnabled: true,', 'trailingStopEnabled: true,\n    maxOpenTrades: 4,\n    entriesPerSignal: 1,\n    maxConsecutiveLosses: 3,\n    cooldownMinutes: 15,\n    maxDailyLossPercent: 5,\n    maxDailyLossAmount: 50,');
            code = code.substring(0, riskConfigStart) + riskConfigStr + code.substring(riskConfigEnd);
        }
    }
}

fs.writeFileSync('server.ts', code);
console.log("Fixed types");
