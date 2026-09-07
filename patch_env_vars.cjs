const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Inside verify-and-connect-mt5:
const regex = /botState\.account = \{[\s\S]*?metaApiUrl: cleanBridgeUrl,/;
if (code.match(regex)) {
    code = code.replace(
        /botState\.account = \{/,
        "updateEnvVariable('MT5_BRIDGE_URL', cleanBridgeUrl);\n        updateEnvVariable('MT5_API_KEY', cleanApiKey);\n        if (password) { updateEnvVariable('MT5_PASSWORD', password); }\n\n        botState.account = {"
    );
}

// When booting, we can populate metaApiToken from process.env if it exists
const oldBotStateInit = `    metaApiAccountId: initialSavedConfig.account.metaApiAccountId,
    metaApiToken: initialSavedConfig.account.metaApiToken,
    metaApiUrl: initialSavedConfig.account.metaApiUrl,`;

const newBotStateInit = `    metaApiAccountId: initialSavedConfig.account.metaApiAccountId,
    metaApiToken: initialSavedConfig.account.metaApiToken || process.env.MT5_API_KEY,
    metaApiUrl: initialSavedConfig.account.metaApiUrl || process.env.MT5_BRIDGE_URL,`;

if (code.includes('metaApiToken: initialSavedConfig.account.metaApiToken')) {
    code = code.replace(oldBotStateInit, newBotStateInit);
} else {
    // If not found, let's inject it at botState.account init
    const botInitAcc = `account: {
    ...initialSavedConfig.account,`;
    const botInitAccReplace = `account: {
    ...initialSavedConfig.account,
    metaApiToken: initialSavedConfig.account.metaApiToken || process.env.MT5_API_KEY,
    metaApiUrl: initialSavedConfig.account.metaApiUrl || process.env.MT5_BRIDGE_URL,`;
    
    code = code.replace(botInitAcc, botInitAccReplace);
}

fs.writeFileSync('server.ts', code);
console.log('patched env vars saving and loading');
