const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update risk config interface
code = code.replace(
    'trailingStopEnabled: boolean;',
    'trailingStopEnabled: boolean;\\n    trailingStopActivationPoints?: number;\\n    trailingStopDistancePoints?: number;\\n    trailingStopBreakEven?: boolean;\\n    trailingStopBreakEvenOffset?: number;'
);

// Update default config
code = code.replace(
    'trailingStopEnabled: true,',
    'trailingStopEnabled: true,\\n    trailingStopActivationPoints: 20,\\n    trailingStopDistancePoints: 10,\\n    trailingStopBreakEven: true,\\n    trailingStopBreakEvenOffset: 2,'
);

// Update route config saving
const configSaveOld = "if (riskConfig.trailingStopEnabled !== undefined) botState.riskConfig.trailingStopEnabled = Boolean(riskConfig.trailingStopEnabled);";
const configSaveNew = `if (riskConfig.trailingStopEnabled !== undefined) botState.riskConfig.trailingStopEnabled = Boolean(riskConfig.trailingStopEnabled);
      if (riskConfig.trailingStopActivationPoints !== undefined) botState.riskConfig.trailingStopActivationPoints = Number(riskConfig.trailingStopActivationPoints);
      if (riskConfig.trailingStopDistancePoints !== undefined) botState.riskConfig.trailingStopDistancePoints = Number(riskConfig.trailingStopDistancePoints);
      if (riskConfig.trailingStopBreakEven !== undefined) botState.riskConfig.trailingStopBreakEven = Boolean(riskConfig.trailingStopBreakEven);
      if (riskConfig.trailingStopBreakEvenOffset !== undefined) botState.riskConfig.trailingStopBreakEvenOffset = Number(riskConfig.trailingStopBreakEvenOffset);`;
code = code.replace(configSaveOld, configSaveNew);

fs.writeFileSync('server.ts', code);
