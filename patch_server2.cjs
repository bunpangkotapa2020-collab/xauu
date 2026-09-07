const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `    res.json({
      ...botState,
      autoRiskProfile,
      startConfirmation,
      serverTime: serverTimeStr,
      isInsideTradingHours: isInsideHours,
      lastSavedAt: botState.lastSavedAt || new Date().toISOString(),
      isAutoSaved: true,
      liveEaConfig: ictEaEngine.config
    });`;

const replacement = `    res.json({
      ...botState,
      autoRiskProfile,
      startConfirmation,
      serverTime: serverTimeStr,
      isInsideTradingHours: isInsideHours,
      lastSavedAt: botState.lastSavedAt || new Date().toISOString(),
      isAutoSaved: true,
      liveEaConfig: {
        ...ictEaEngine.config,
        LIVE_TRADING_ENABLED: ictEaEngine.LIVE_TRADING_ENABLED
      }
    });`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts /api/bot/state');
