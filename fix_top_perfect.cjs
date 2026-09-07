const fs = require('fs');
let code = fs.readFileSync('server_original_from_map.ts', 'utf8');

const importStart = code.indexOf("import express from 'express';");
const dotenvIndex = code.indexOf("dotenv.config();");

if (importStart > -1 && dotenvIndex > -1) {
    const topFunc = code.substring(0, importStart);
    const importsStr = code.substring(importStart, dotenvIndex);
    const rest = code.substring(dotenvIndex);
    
    let finalCode = importsStr + '\n\n' + topFunc + rest;
    
    // Fix interface safely
    const interfaceStart = finalCode.indexOf('interface BotServerState {');
    // find the closing brace of the interface by searching for "account: {"
    const accountStart = finalCode.indexOf('account: {', interfaceStart);
    const userPrefStart = finalCode.indexOf('userPreferences: {', accountStart);
    const interfaceEnd = finalCode.indexOf('}', finalCode.indexOf('}', userPrefStart) + 1) + 1; // get to the end of userPreferences and then the end of interface
    
    if (interfaceStart > -1 && interfaceEnd > interfaceStart) {
        let interfaceCode = finalCode.substring(interfaceStart, interfaceEnd);
        if (!interfaceCode.includes('isInsideTradingHours: boolean;')) {
            // append to the end of the interface, right before the last closing brace
            const lastBraceIndex = interfaceCode.lastIndexOf('}');
            const newFields = `\n  isInsideTradingHours: boolean;\n  openTrades: any[];\n  signalDetails?: any;\n  manualTrades: any[];\n  isAutoSaved?: boolean;\n`;
            interfaceCode = interfaceCode.substring(0, lastBraceIndex) + newFields + '}';
        }
        
        // fix riskConfig
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
    console.log("Fixed server.ts perfectly without duplicates!");
}
