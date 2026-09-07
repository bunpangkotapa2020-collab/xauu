const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /isConnected: !!initialSavedConfig\.account\.metaApiAccountId/g;
if (code.match(regex)) {
    code = code.replace(
        regex,
        'isConnected: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server)'
    );
    console.log('Fixed isConnected check in server.ts');
}

const regex2 = /serverConnected: !!initialSavedConfig\.account\.metaApiAccountId/g;
if (code.match(regex2)) {
    code = code.replace(
        regex2,
        'serverConnected: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server)'
    );
}

const regex3 = /marketDataReceiving: !!initialSavedConfig\.account\.metaApiAccountId/g;
if (code.match(regex3)) {
    code = code.replace(
        regex3,
        'marketDataReceiving: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server)'
    );
}

const regex4 = /tradingPermission: !!initialSavedConfig\.account\.metaApiAccountId/g;
if (code.match(regex4)) {
    code = code.replace(
        regex4,
        'tradingPermission: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server)'
    );
}

const regex5 = /eaConnected: !!initialSavedConfig\.account\.metaApiAccountId/g;
if (code.match(regex5)) {
    code = code.replace(
        regex5,
        'eaConnected: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server)'
    );
}

const regex6 = /exnessServerConnected: !!initialSavedConfig\.account\.metaApiAccountId/g;
if (code.match(regex6)) {
    code = code.replace(
        regex6,
        'exnessServerConnected: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server)'
    );
}

const regex7 = /marketDataFeedLive: !!initialSavedConfig\.account\.metaApiAccountId/g;
if (code.match(regex7)) {
    code = code.replace(
        regex7,
        'marketDataFeedLive: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server)'
    );
}

const regex8 = /tradingPermissionGranted: !!initialSavedConfig\.account\.metaApiAccountId/g;
if (code.match(regex8)) {
    code = code.replace(
        regex8,
        'tradingPermissionGranted: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server)'
    );
}

const regex9 = /eaLoadedAndReady: !!initialSavedConfig\.account\.metaApiAccountId/g;
if (code.match(regex9)) {
    code = code.replace(
        regex9,
        'eaLoadedAndReady: !!(initialSavedConfig.account.loginId && initialSavedConfig.account.server)'
    );
}

// In the polling loop we had:
// if (!botState.account.isConnected || !botState.account.metaApiAccountId) return;
// This will block the generic REST poll!
const pollRegex = /if \(\!botState\.account\.isConnected \|\| \!botState\.account\.metaApiAccountId\) return;/g;
if (code.match(pollRegex)) {
    code = code.replace(
        pollRegex,
        'if (!botState.account.isConnected) return;'
    );
    console.log('Fixed polling loop gate');
}


fs.writeFileSync('server.ts', code);
