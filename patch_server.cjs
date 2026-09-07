const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Initial settings definition
code = code.replace(
    'maxSpreadPoints: 27,',
    'maxSpreadPoints: 27,\n    additionalEntryDistance: 4.0,'
);

// 2. Mapping from API to DaRa (around line 485)
const target2 = `maxSpreadPoints: Number(rc.maxSpreadPoints !== undefined && !isNaN(Number(rc.maxSpreadPoints)) ? rc.maxSpreadPoints : initialSettings.maxSpreadPoints),`;
const replace2 = `maxSpreadPoints: Number(rc.maxSpreadPoints !== undefined && !isNaN(Number(rc.maxSpreadPoints)) ? rc.maxSpreadPoints : initialSettings.maxSpreadPoints),\n                additionalEntryDistance: Number(rc.additionalEntryDistance !== undefined && !isNaN(Number(rc.additionalEntryDistance)) ? rc.additionalEntryDistance : (initialSettings.additionalEntryDistance !== undefined ? initialSettings.additionalEntryDistance : 4.0)),`;
code = code.replace(target2, replace2);

// 3. Mapping from BotState (around line 1477)
code = code.replace(
    'maxSpreadPoints: 27,\n    stopLossPips: 10,',
    'maxSpreadPoints: 27,\n    additionalEntryDistance: 4.0,\n    stopLossPips: 10,'
);

// 4. CleanSettings inside state recovery (around line 1550)
const target4 = `maxSpreadPoints: Number(rc.maxSpreadPoints !== undefined && !isNaN(Number(rc.maxSpreadPoints)) ? rc.maxSpreadPoints : 27),`;
const replace4 = `maxSpreadPoints: Number(rc.maxSpreadPoints !== undefined && !isNaN(Number(rc.maxSpreadPoints)) ? rc.maxSpreadPoints : 27),\n      additionalEntryDistance: Number(rc.additionalEntryDistance !== undefined && !isNaN(Number(rc.additionalEntryDistance)) ? rc.additionalEntryDistance : 4.0),`;
code = code.replace(target4, replace4);

// 5. POST /api/settings/risk 
const target5 = `if (riskConfig.maxSpreadPoints !== undefined) botState.riskConfig.maxSpreadPoints = Number(riskConfig.maxSpreadPoints);`;
const replace5 = `if (riskConfig.maxSpreadPoints !== undefined) botState.riskConfig.maxSpreadPoints = Number(riskConfig.maxSpreadPoints);\n      if (riskConfig.additionalEntryDistance !== undefined) botState.riskConfig.additionalEntryDistance = Number(riskConfig.additionalEntryDistance);`;
code = code.replace(target5, replace5);

fs.writeFileSync('server.ts', code);
