const fs = require('fs');
let code = fs.readFileSync('server_original_from_map.ts', 'utf8');

const splitToken = "}import express from 'express';";
if (code.includes(splitToken)) {
    const parts = code.split(splitToken);
    
    // parts[0] is `function updateEnvVariable...`
    // parts[1] is `import path from 'path';...`
    
    // let's extract all the imports from parts[1]
    // The imports are on the same line up to `dotenv.config();`
    
    const rest = "import express from 'express';" + parts[1];
    
    const dotenvIndex = rest.indexOf('dotenv.config();');
    
    const importsStr = rest.substring(0, dotenvIndex);
    const bodyStr = rest.substring(dotenvIndex);
    
    // Now we construct the correct file
    const newCode = importsStr + '\n\n' + parts[0] + '}\n' + bodyStr;
    
    // Fix interface while we are at it
    let finalCode = newCode;
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
