const fs = require('fs');
let code = fs.readFileSync('server_original_from_map.ts', 'utf8');

const importStart = code.indexOf("import express from 'express';");
const dotenvIndex = code.indexOf("dotenv.config();");

if (importStart > -1 && dotenvIndex > -1) {
    const topFunc = code.substring(0, importStart);
    const importsStr = code.substring(importStart, dotenvIndex);
    const rest = code.substring(dotenvIndex);
    
    let finalCode = importsStr + '\n\n' + topFunc + rest;
    
    // Fix interface while we are at it
    const interfaceStart = finalCode.indexOf('interface BotServerState {');
    const interfaceEnd = finalCode.indexOf('}', finalCode.indexOf('isAutoSaved?: boolean;')) + 1;
    
    if (interfaceStart > -1 && interfaceEnd > -1) {
        let interfaceCode = finalCode.substring(interfaceStart, interfaceEnd);
        if (!interfaceCode.includes('isInsideTradingHours: boolean;')) {
            interfaceCode = interfaceCode.replace('isAutoSaved?: boolean;', 'isInsideTradingHours: boolean;\n  openTrades: any[];\n  signalDetails?: any;\n  manualTrades: any[];\n  isAutoSaved?: boolean;');
        }
        const riskConfigIndex = interfaceCode.indexOf('riskConfig: {');
        if (riskConfigIndex > -1) {
            const trailingStopIndex = interfaceCode.indexOf('trailingStopEnabled: boolean;', riskConfigIndex);
            if (trailingStopIndex > -1 && !interfaceCode.includes('maxOpenTrades: number;', riskConfigIndex)) {
                interfaceCode = interfaceCode.replace('trailingStopEnabled: boolean;', 'trailingStopEnabled: boolean;\n    maxOpenTrades: number;\n    entriesPerSignal: number;\n    maxConsecutiveLosses: number;\n    cooldownMinutes: number;\n    maxDailyLossPercent: number;\n    maxDailyLossAmount: number;');
            }
        }
        finalCode = finalCode.substring(0, interfaceStart) + interfaceCode + finalCode.substring(interfaceEnd);
    }
    
    fs.writeFileSync('server.ts', finalCode);
    console.log("Fixed server.ts perfectly!");
}
