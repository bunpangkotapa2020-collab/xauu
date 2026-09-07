const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpoint = `
  app.post('/api/bot/trading-hours', requireAdminAuth, (req, res) => {
    const { tradingHours } = req.body || {};
    if (tradingHours) {
      if (tradingHours.enabled !== undefined) botState.tradingHours.enabled = Boolean(tradingHours.enabled);
      if (tradingHours.startHour !== undefined) botState.tradingHours.startHour = String(tradingHours.startHour);
      if (tradingHours.stopHour !== undefined) botState.tradingHours.stopHour = String(tradingHours.stopHour);
      saveBotConfig();
    }
    res.json({ success: true, tradingHours: botState.tradingHours });
  });
`;

if (!code.includes('/api/bot/trading-hours')) {
  code = code.replace(/app\.post\('\/api\/bot\/update-risk-config'/, endpoint + "\n  app.post('/api/bot/update-risk-config'");
  fs.writeFileSync('server.ts', code);
}
