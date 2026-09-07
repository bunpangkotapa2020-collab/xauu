const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldReturn = `    res.json({
      ...botState,
      autoRiskProfile,
      startConfirmation,
      serverTime: serverTimeStr,
      isInsideTradingHours: isInsideHours,
      lastSavedAt: botState.lastSavedAt || new Date().toISOString(),
      isAutoSaved: true,
    });`;

const newReturn = `    res.json({
      ...botState,
      autoRiskProfile,
      startConfirmation,
      serverTime: serverTimeStr,
      isInsideTradingHours: isInsideHours,
      lastSavedAt: botState.lastSavedAt || new Date().toISOString(),
      isAutoSaved: true,
      liveEaConfig: ictEaEngine.config
    });`;

content = content.replace(oldReturn, newReturn);
fs.writeFileSync('server.ts', content);
console.log("Patched server.ts with liveEaConfig");
