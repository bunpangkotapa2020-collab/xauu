const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newLogic = `
  app.get('/api/bot/state', (req, res) => {
    const now = new Date();
    const serverTimeStr = now.toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isInsideHours = checkInsideTradingHours();

    // Auto-calculate risk based on balance to enforce user requirements
    const balance = botState.account.balance || 0;
    const riskPercent = 1;
    const maxLossPerTrade = (balance * riskPercent) / 100;
    const maxDailyLoss = (balance * 5) / 100;
    const slPips = 30;
    const tpPips = 60;
    
    let pipValuePerLot = 10; 
    let lotSize = maxLossPerTrade / (slPips * pipValuePerLot);
    if (lotSize < 0.01 && balance > 0) lotSize = 0.01;
    if (balance === 0) lotSize = 0;
    
    const calculatedLot = Number(lotSize.toFixed(2));
    const calculatedMaxDailyLoss = Number(maxDailyLoss.toFixed(2));

    const autoRiskProfile = {
      riskPerTradePercent: riskPercent,
      maxLossPerTrade: Number(maxLossPerTrade.toFixed(2)),
      maxDailyLoss: calculatedMaxDailyLoss,
      maxDrawdownPercent: 10,
      lotSize: calculatedLot,
      lotPerEntry: calculatedLot,
      tpPips,
      slPips,
      riskRewardRatio: '1:2'
    };

    // FORCE EA to use these automatically calculated values
    botState.riskConfig.lotSize = calculatedLot || 0.01;
    botState.riskConfig.maxDailyLoss = calculatedMaxDailyLoss || 50;
    botState.riskConfig.stopLossPips = slPips;
    botState.riskConfig.takeProfitPips = tpPips;
    botState.riskConfig.maxDrawdownPercent = 10;

    res.json({
      ...botState,
      autoRiskProfile,
      serverTime: serverTimeStr,
      isInsideTradingHours: isInsideHours,
      lastSavedAt: botState.lastSavedAt || new Date().toISOString(),
      isAutoSaved: true,
    });
  });
`;

code = code.replace(/app\.get\('\/api\/bot\/state', \(req, res\) => \{[\s\S]*?isAutoSaved: true,\s*\}\);\s*\}\);/g, newLogic.trim());
fs.writeFileSync('server.ts', code);
console.log('Fixed EA auto risk link');
