const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldUpdate = `if (riskConfig.trailingStopEnabled !== undefined) botState.riskConfig.trailingStopEnabled = Boolean(riskConfig.trailingStopEnabled);`;
const newUpdate = `if (riskConfig.trailingStopEnabled !== undefined) botState.riskConfig.trailingStopEnabled = Boolean(riskConfig.trailingStopEnabled);
      if (riskConfig.maxOpenTrades !== undefined) botState.riskConfig.maxOpenTrades = Number(riskConfig.maxOpenTrades);
      if (riskConfig.entriesPerSignal !== undefined) botState.riskConfig.entriesPerSignal = Number(riskConfig.entriesPerSignal);
      if (riskConfig.maxConsecutiveLosses !== undefined) botState.riskConfig.maxConsecutiveLosses = Number(riskConfig.maxConsecutiveLosses);
      if (riskConfig.cooldownMinutes !== undefined) botState.riskConfig.cooldownMinutes = Number(riskConfig.cooldownMinutes);
      if (riskConfig.maxDailyLossPercent !== undefined) botState.riskConfig.maxDailyLossPercent = Number(riskConfig.maxDailyLossPercent);
      if (riskConfig.maxDailyLossAmount !== undefined) botState.riskConfig.maxDailyLossAmount = Number(riskConfig.maxDailyLossAmount);`;

code = code.replace(oldUpdate, newUpdate);
fs.writeFileSync('server.ts', code);
