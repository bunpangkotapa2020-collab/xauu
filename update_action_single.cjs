const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const closeSingleLogic = `
    } else if (action === 'close_single') {
      if (botState.currentTrade) {
        const closedProfit = botState.currentTrade.floatingProfit;
        const tradeId = botState.currentTrade.id;
        
        if (tradeId && tradeId !== 'PENDING') {
           closeRealTrade(tradeId).catch(console.error);
        }

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

code = code.replace(/    \} else if \(action === 'close_single'\) \{[\s\S]*?saveBotConfig\(\);\n      \}/, closeSingleLogic.trim());
fs.writeFileSync('server.ts', code);
console.log('Action single close logic updated');
