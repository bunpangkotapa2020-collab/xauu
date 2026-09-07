const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldUpdateRisk = `  app.post('/api/bot/update-risk-config', requireAdminAuth, (req, res) => {
    botState.riskConfig = { ...botState.riskConfig, ...req.body };
    saveBotConfig();`;

const newUpdateRisk = `  app.post('/api/bot/update-risk-config', requireAdminAuth, (req, res) => {
    botState.riskConfig = { ...botState.riskConfig, ...req.body };
    
    // Update DaRa M1 EA Engine settings
    if (global.daraEngine && botState.riskConfig) {
        global.daraEngine.updateUserSettings({
            lotSize: botState.riskConfig.lotSize || 0.01,
            slDistance: botState.riskConfig.stopLossPips || 250,
            tpDistance: botState.riskConfig.takeProfitPips || 350,
            dailyLossLimit: botState.riskConfig.maxDailyLossAmount || 50
        });
    }
    
    saveBotConfig();`;

code = code.replace(oldUpdateRisk, newUpdateRisk);
fs.writeFileSync('server.ts', code);
console.log('patched update-risk-config');
