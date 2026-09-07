const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldBotStateInit = `  account: {
    ...initialSavedConfig.account,
    isConnected: false,
    serverConnected: false,
    marketDataReceiving: false,
    tradingPermission: false,
    eaConnected: false,
    balance: 0,
    equity: 0,
    freeMargin: 0,
    stages: {
      appLoggedIn: true,
      mt5AccountConfigured: !!initialSavedConfig.account.loginId,
      exnessServerConnected: false,
      marketDataFeedLive: false,
      tradingPermissionGranted: false,
      eaLoadedAndReady: false,
    },
  },`;

const newBotStateInit = `  account: {
    ...initialSavedConfig.account,
    isConnected: !!initialSavedConfig.account.metaApiAccountId,
    serverConnected: !!initialSavedConfig.account.metaApiAccountId,
    marketDataReceiving: !!initialSavedConfig.account.metaApiAccountId,
    tradingPermission: !!initialSavedConfig.account.metaApiAccountId,
    eaConnected: !!initialSavedConfig.account.metaApiAccountId,
    balance: initialSavedConfig.account.balance || 0,
    equity: initialSavedConfig.account.equity || 0,
    freeMargin: initialSavedConfig.account.freeMargin || 0,
    stages: {
      appLoggedIn: true,
      mt5AccountConfigured: !!initialSavedConfig.account.loginId,
      exnessServerConnected: !!initialSavedConfig.account.metaApiAccountId,
      marketDataFeedLive: !!initialSavedConfig.account.metaApiAccountId,
      tradingPermissionGranted: !!initialSavedConfig.account.metaApiAccountId,
      eaLoadedAndReady: !!initialSavedConfig.account.metaApiAccountId,
    },
  },`;

code = code.replace(oldBotStateInit, newBotStateInit);
fs.writeFileSync('server.ts', code);
console.log('patched botState initialization');
