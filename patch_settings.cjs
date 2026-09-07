const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSettings = `    if (userPreferences) {
      botState.userPreferences = { ...botState.userPreferences, ...userPreferences };
    }
    saveBotConfig();`;

const newSettings = `    if (userPreferences) {
      botState.userPreferences = { ...botState.userPreferences, ...userPreferences };
    }
    
    // Update DaRa M1 EA Engine settings
    if (global.daraEngine && botState.riskConfig) {
        global.daraEngine.updateUserSettings({
            lotSize: botState.riskConfig.lotSize || 0.01,
            slDistance: botState.riskConfig.minSlPips || 300,
            tpDistance: botState.riskConfig.tpPips || 500,
            dailyLossLimit: botState.riskConfig.dailyLossLimit || 50
        });
    }

    saveBotConfig();`;

code = code.replace(oldSettings, newSettings);
fs.writeFileSync('server.ts', code);
console.log('patched settings');
