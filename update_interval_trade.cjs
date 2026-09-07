const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const intervalLogic = `
setInterval(() => {
  if (botState.account.isConnected) {
     // simulate slight gold price movement
     const direction = Math.random() > 0.5 ? 1 : -1;
     const change = Math.random() * 0.5;
     botState.goldPrice = Number(((botState.goldPrice || 2748.50) + (direction * change)).toFixed(2));
     botState.bidPrice = botState.goldPrice;
     botState.spreadPoints = Math.floor(Math.random() * (18 - 8 + 1)) + 8; // spread 8-18 points
     botState.askPrice = Number((botState.goldPrice + (botState.spreadPoints / 100)).toFixed(2));
     
     // simulate btc price movement
     const btcDirection = Math.random() > 0.5 ? 1 : -1;
     const btcChange = Math.random() * 15;
     botState.btcPrice = Number(((botState.btcPrice || 63500.00) + (btcDirection * btcChange)).toFixed(2));
     botState.btcBidPrice = botState.btcPrice;
     const btcSpread = Math.floor(Math.random() * 20) + 10;
     botState.btcAskPrice = Number((botState.btcPrice + (btcSpread)).toFixed(2));

     botState.lastPriceUpdate = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
     
     // REAL TRADING LOGIC
     if (botState.status === 'running' && !botState.currentTrade) {
       // Simple Strategy: Randomly open BUY or SELL for demonstration
       // In a real AI bot, this would call an AI model
       const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
       botState.currentTrade = {
          id: 'PENDING',
          magicNumber: botState.magicNumber,
          isBotTrade: true,
          symbol: 'XAUUSD',
          side: side,
          lot: botState.riskConfig.lotSize || 0.01,
          entryPrice: botState.goldPrice,
          currentPrice: botState.goldPrice,
          sl: side === 'BUY' ? botState.goldPrice - 3.0 : botState.goldPrice + 3.0,
          tp: side === 'BUY' ? botState.goldPrice + 6.0 : botState.goldPrice - 6.0,
          floatingProfit: 0,
          openedAt: new Date().toLocaleTimeString('km-KH')
       };
       // Fire network request asynchronously
       openRealTrade(side).then(res => {
         if (res && res.orderId) {
            botState.currentTrade.id = res.orderId;
            botState.statusMessageKhmer = \`✅ បានបើក Real Trade (\${side}) ជោគជ័យតាមរយៈ Bridge\`;
            saveBotConfig();
         } else {
            botState.currentTrade = null; // Failed to open
            botState.status = 'stopped';
            botState.statusMessageKhmer = \`🔴 បើក Real Trade (\${side}) បរាជ័យ! សូមពិនិត្យ MT5 Error\`;
            saveBotConfig();
         }
       }).catch(err => {
          botState.currentTrade = null;
          botState.status = 'stopped';
          botState.statusMessageKhmer = \`🔴 មិនអាចបញ្ជូនអ័រឌ័របាន: \${err.message}\`;
          saveBotConfig();
       });
     }
  }
}, 3000);
`;

code = code.replace(/setInterval\(\(\) => \{[\s\S]*?\}, 3000\);/, intervalLogic.trim());
fs.writeFileSync('server.ts', code);
console.log('Trade interval logic updated');
