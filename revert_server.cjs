const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Revert interval
const newInterval = `
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
  }
}, 3000);
`;

code = code.replace(/setInterval\(\(\) => \{[\s\S]*?\}, 3000\);/, newInterval.trim());

// 2. Remove closeRealTrade / openRealTrade
code = code.replace(/async function closeRealTrade[\s\S]*?async function openRealTrade/g, 'async function openRealTrade');
code = code.replace(/async function openRealTrade[\s\S]*?return false;\n\}/g, '');

// 3. Revert close_all action
const closeAllOld = `
    } else if (action === 'close_all') {
      if (botState.currentTrade && botState.currentTrade.magicNumber === botState.magicNumber) {
        const closedProfit = botState.currentTrade.floatingProfit;
        botState.todayProfitLoss = Number((botState.todayProfitLoss + closedProfit).toFixed(2));
        botState.account.balance = Number((botState.account.balance + closedProfit).toFixed(2));
        botState.account.equity = botState.account.balance;
        botState.todayTradeCount += 1;
        if (closedProfit >= 0) botState.todayWinCount += 1;
        else botState.todayLossCount += 1;
        botState.currentTrade = null;
        botState.statusMessageKhmer = \`🛑 បានបិទរាល់ Bot Orders ទាំងអស់ (Magic: \${botState.magicNumber}) — ចំណេញ/ខាត: \${closedProfit >= 0 ? '+' : ''}\${closedProfit} \${botState.account.currency}\`;
        saveBotConfig();
      } else {
        botState.statusMessageKhmer = '🛑 មិនមាន Order របស់ Bot ត្រូវបិទឡើយ';
      }
`;

code = code.replace(/    \} else if \(action === 'close_all'\) \{[\s\S]*?botState\.statusMessageKhmer = '🛑 មិនមាន Order របស់ Bot ត្រូវបិទឡើយ';\n      \}/, closeAllOld.trim());

// 4. Revert close_single action
const closeSingleOld = `
    } else if (action === 'close_single') {
      if (botState.currentTrade) {
        const closedProfit = botState.currentTrade.floatingProfit;
        botState.todayProfitLoss = Number((botState.todayProfitLoss + closedProfit).toFixed(2));
        botState.account.balance = Number((botState.account.balance + closedProfit).toFixed(2));
        botState.account.equity = botState.account.balance;
        botState.todayTradeCount += 1;
        if (closedProfit >= 0) botState.todayWinCount += 1;
        else botState.todayLossCount += 1;
        botState.currentTrade = null;
        botState.statusMessageKhmer = \`បានបិទ Trade ដោយជោគជ័យ (P/L: \${closedProfit >= 0 ? '+' : ''}\${closedProfit} \${botState.account.currency})\`;
        saveBotConfig();
      }
`;
code = code.replace(/    \} else if \(action === 'close_single'\) \{[\s\S]*?saveBotConfig\(\);\n      \}/, closeSingleOld.trim());

fs.writeFileSync('server.ts', code);
console.log('Server reverted');
