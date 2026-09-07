const fs = require('fs');
let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

const oldEffect = `      if (botState.riskConfig.stopLossPips !== undefined) {
        setSlPips(String(botState.riskConfig.stopLossPips));
      }
      if (botState.riskConfig.takeProfitPips !== undefined) {
        setTpPips(String(botState.riskConfig.takeProfitPips));
      }`;
const newEffect = `      if (botState.riskConfig.trailingStopEnabled !== undefined) {
        setTrailingStopEnabled(botState.riskConfig.trailingStopEnabled);
      }
      if (botState.riskConfig.trailingStopActivationPoints !== undefined) {
        setTrailingStopActivationPoints(String(botState.riskConfig.trailingStopActivationPoints));
      }
      if (botState.riskConfig.trailingStopDistancePoints !== undefined) {
        setTrailingStopDistancePoints(String(botState.riskConfig.trailingStopDistancePoints));
      }
      if (botState.riskConfig.trailingStopBreakEven !== undefined) {
        setTrailingStopBreakEven(botState.riskConfig.trailingStopBreakEven);
      }
      if (botState.riskConfig.trailingStopBreakEvenOffset !== undefined) {
        setTrailingStopBreakEvenOffset(String(botState.riskConfig.trailingStopBreakEvenOffset));
      }`;
code = code.replace(oldEffect, newEffect);

code = code.replace("botState?.riskConfig?.stopLossPips,", "botState?.riskConfig?.trailingStopEnabled,");
code = code.replace("botState?.riskConfig?.takeProfitPips", "botState?.riskConfig?.trailingStopActivationPoints, botState?.riskConfig?.trailingStopDistancePoints");

const oldVars = "const parsedSlPips = Number(slPips) || 25;\n  const parsedTpPips = Number(tpPips) || 35;";
code = code.replace(oldVars, "");

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
