const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /account: \{\n    accountType: 'cent' as const,\n    server: 'Exness-Real21',\n    loginId: '8492019',\n    isConnected: true,\n    serverConnected: true,/;

const replaceStr = `account: {
    accountType: 'cent' as const,
    server: 'Exness-Real21',
    loginId: '8492019',
    metaApiAccountId: 'mock_account',
    metaApiToken: 'mock_token',
    metaApiUrl: 'https://mt-client-api-v1.backup-new-york.agiliumtrade.ai',
    isConnected: true,
    serverConnected: true,`;

code = code.replace(regex, replaceStr);
fs.writeFileSync('server.ts', code);
console.log("Defaults updated");
