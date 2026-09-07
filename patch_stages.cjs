const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "botState.account.tradingPermission = true;",
  "botState.account.tradingPermission = true;\n    botState.account.stages.mt5AccountConfigured = true;\n    botState.account.stages.exnessServerConnected = true;\n    botState.account.stages.marketDataFeedLive = true;\n    botState.account.stages.tradingPermissionGranted = true;\n    botState.account.stages.eaLoadedAndReady = true;"
);

fs.writeFileSync('server.ts', code);
