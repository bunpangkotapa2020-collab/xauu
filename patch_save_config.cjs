const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSaveConfig = `        marginLevel: botState.account.marginLevel,
        currency: botState.account.currency,
        stages: botState.account.stages,
      },`;

const newSaveConfig = `        marginLevel: botState.account.marginLevel,
        currency: botState.account.currency,
        stages: botState.account.stages,
        metaApiAccountId: botState.account.metaApiAccountId,
        metaApiToken: botState.account.metaApiToken,
        metaApiUrl: botState.account.metaApiUrl,
      },`;

if (code.includes(oldSaveConfig)) {
    code = code.replace(oldSaveConfig, newSaveConfig);
    fs.writeFileSync('server.ts', code);
    console.log('patched saveBotConfig');
} else {
    console.log('could not find oldSaveConfig');
}
