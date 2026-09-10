const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// 1. Add entryDistance and trailingDistance to the update-risk-config route
code = code.replace(
  /if \(riskConfig\.trailingStopEnabled !== undefined\) botState\.riskConfig\.trailingStopEnabled = Boolean\(riskConfig\.trailingStopEnabled\);/,
  `if (riskConfig.trailingStopEnabled !== undefined) botState.riskConfig.trailingStopEnabled = Boolean(riskConfig.trailingStopEnabled);
      if (riskConfig.entryDistance !== undefined) botState.riskConfig.entryDistance = Number(riskConfig.entryDistance);
      if (riskConfig.trailingDistance !== undefined) botState.riskConfig.trailingDistance = Number(riskConfig.trailingDistance);`
);

// 2. Add trailingDistance to the daraEngine.updateUserSettings mapping
// in three places (line 1168, line 3588, line 3635 roughly)
code = code.replace(
  /trailingEnabled: botState\.riskConfig\.trailingStopEnabled !== false,/g,
  `trailingEnabled: botState.riskConfig.trailingStopEnabled !== false,
        trailingDistance: botState.riskConfig.trailingDistance,`
);

code = code.replace(
  /trailingEnabled: botState\.riskConfig\.trailingStopEnabled,/g,
  `trailingEnabled: botState.riskConfig.trailingStopEnabled,
              trailingDistance: botState.riskConfig.trailingDistance,`
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts');
