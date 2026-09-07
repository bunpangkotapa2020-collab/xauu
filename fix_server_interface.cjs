const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const interfaceStart = code.indexOf('interface BotServerState {');
const interfaceEnd = code.indexOf('}', code.indexOf('isAutoSaved?: boolean;')) + 1;

let interfaceCode = code.substring(interfaceStart, interfaceEnd);

// Add missing properties
if (!interfaceCode.includes('isInsideTradingHours: boolean;')) {
    interfaceCode = interfaceCode.replace('isAutoSaved?: boolean;', 'isInsideTradingHours: boolean;\n  openTrades: any[];\n  signalDetails?: any;\n  manualTrades: any[];\n  isAutoSaved?: boolean;');
}

// Add missing riskConfig properties
const riskConfigIndex = interfaceCode.indexOf('riskConfig: {');
if (riskConfigIndex > -1) {
    const trailingStopIndex = interfaceCode.indexOf('trailingStopEnabled: boolean;', riskConfigIndex);
    if (trailingStopIndex > -1 && !interfaceCode.includes('maxOpenTrades: number;', riskConfigIndex)) {
        interfaceCode = interfaceCode.replace('trailingStopEnabled: boolean;', 'trailingStopEnabled: boolean;\n    maxOpenTrades: number;\n    entriesPerSignal: number;\n    maxConsecutiveLosses: number;\n    cooldownMinutes: number;\n    maxDailyLossPercent: number;\n    maxDailyLossAmount: number;');
    }
}

code = code.substring(0, interfaceStart) + interfaceCode + code.substring(interfaceEnd);
fs.writeFileSync('server.ts', code);
console.log('Fixed interface in server.ts');
