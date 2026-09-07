const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSync = `ictEaEngine.config.tradingSessionEnd = botState.tradingHours?.stopHour || "22:00";`;
const newSync = `ictEaEngine.config.tradingSessionEnd = botState.tradingHours?.stopHour || "22:00";
      ictEaEngine.config.trailingStopEnabled = botState.riskConfig?.trailingStopEnabled ?? true;
      ictEaEngine.config.trailingStopActivationPoints = botState.riskConfig?.trailingStopActivationPoints ?? 20;
      ictEaEngine.config.trailingStopDistancePoints = botState.riskConfig?.trailingStopDistancePoints ?? 10;`;
code = code.replace(oldSync, newSync);

fs.writeFileSync('server.ts', code);
