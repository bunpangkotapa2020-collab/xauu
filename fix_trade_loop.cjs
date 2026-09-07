const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const tradeLoop = `
// Simulated Bot Trade Logic (Mock)
setInterval(() => {
  if (botState.status !== 'running') return;
  if (!botState.account.isConnected) return;
  if (botState.dailyLossLimitHit) {
    botState.status = 'stopped';
    return;
  }

  // Open trade randomly if none exists
  if (!botState.currentTrade) {
    if (Math.random() > 0.3) {
      const isBuy = Math.random() > 0.5;
      botState.currentTrade = {
        id: 'T-' + Math.floor(Math.random() * 1000000),
        magicNumber: botState.magicNumber,
        isBotTrade: true,
        symbol: 'XAUUSD',
        side: isBuy ? 'BUY' : 'SELL',
        lot: botState.riskConfig.lotSize,
        entryPrice: isBuy ? botState.askPrice : botState.bidPrice,
        currentPrice: isBuy ? botState.bidPrice : botState.askPrice,
        sl: isBuy ? botState.askPrice - 0.30 : botState.bidPrice + 0.30,
        tp: isBuy ? botState.askPrice + 0.60 : botState.bidPrice - 0.60,
        floatingProfit: -0.50, // Initial spread cost
        openedAt: new Date().toLocaleTimeString('km-KH')
      };
      botState.todayTradeCount++;
    }
  } else {
    // Update floating profit based on current price
    const t = botState.currentTrade;
    const currentGold = botState.goldPrice;
    t.currentPrice = currentGold;
    
    // simple profit calculation
    const pointValue = 100 * t.lot; 
    let priceDiff = t.side === 'BUY' ? (currentGold - t.entryPrice) : (t.entryPrice - currentGold);
    t.floatingProfit = Number((priceDiff * pointValue).toFixed(2));

    // Check SL / TP or random close
    if (t.floatingProfit >= 5 || t.floatingProfit <= -5 || Math.random() > 0.8) {
      botState.todayProfitLoss = Number((botState.todayProfitLoss + t.floatingProfit).toFixed(2));
      botState.account.balance = Number((botState.account.balance + t.floatingProfit).toFixed(2));
      botState.account.equity = botState.account.balance;
      
      if (t.floatingProfit > 0) {
        botState.todayWinCount++;
      } else {
        botState.todayLossCount++;
      }
      botState.currentTrade = null;
    }
  }
}, 2000);
`;

if (!code.includes('Simulated Bot Trade Logic')) {
  // Insert it before let lastSyncTimestamp = 0;
  code = code.replace('let lastSyncTimestamp = 0;', tradeLoop + '\\nlet lastSyncTimestamp = 0;');
  fs.writeFileSync('server.ts', code);
  console.log('Trade loop added');
}
