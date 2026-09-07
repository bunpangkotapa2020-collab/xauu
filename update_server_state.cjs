const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newLogic = `
  app.get('/api/bot/state', (req, res) => {
    const now = new Date();
    const serverTimeStr = now.toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isInsideHours = checkInsideTradingHours();

    // Calculate Auto Risk Profile based on Real Balance
    const balance = botState.account.balance || 0;
    const riskPercent = 1; // 1%
    const maxLossPerTrade = (balance * riskPercent) / 100;
    const maxDailyLoss = (balance * 5) / 100;
    const slPips = 30;
    const tpPips = 60;
    
    // Pip value: assume 1 Standard Lot = $10 per pip. 
    // If account is USC, 1 Cent Lot = 10 USC per pip (assuming standard cent specs, 1 Lot = 100000 units, 1 pip = 10 units = 10 USC)
    let pipValuePerLot = 10; 
    let lotSize = maxLossPerTrade / (slPips * pipValuePerLot);
    if (lotSize < 0.01 && balance > 0) lotSize = 0.01;
    if (balance === 0) lotSize = 0;
    
    const autoRiskProfile = {
      riskPerTradePercent: riskPercent,
      maxLossPerTrade: Number(maxLossPerTrade.toFixed(2)),
      maxDailyLoss: Number(maxDailyLoss.toFixed(2)),
      maxDrawdownPercent: 10,
      lotSize: Number(lotSize.toFixed(2)),
      lotPerEntry: Number(lotSize.toFixed(2)),
      tpPips,
      slPips,
      riskRewardRatio: '1:2'
    };

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

code = code.replace(/app\.get\('\/api\/bot\/state', \(req, res\) => \{[\s\S]*?isAutoSaved: true,\s*\}\);\s*\}\);/g, newLogic);
// Oh wait, my regex might fail. Let's do it safer.

const replaceTarget = `  app.get('/api/bot/state', (req, res) => {
    const now = new Date();
    const serverTimeStr = now.toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isInsideHours = checkInsideTradingHours();

    res.json({
      ...botState,
      serverTime: serverTimeStr,
      isInsideTradingHours: isInsideHours,
      lastSavedAt: botState.lastSavedAt || new Date().toISOString(),
      isAutoSaved: true,
    });
  });`;

code = code.replace(replaceTarget, newLogic.trim());
fs.writeFileSync('server.ts', code);
console.log('Server state endpoint updated');
