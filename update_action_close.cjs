const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const closeAllLogic = `
    } else if (action === 'close_all') {
      if (botState.currentTrade && botState.currentTrade.magicNumber === botState.magicNumber) {
        const closedProfit = botState.currentTrade.floatingProfit;
        const tradeId = botState.currentTrade.id;
        
        // We do it optimistically in UI, but send real command in background
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
        botState.statusMessageKhmer = \`🛑 បានបិទរាល់ Bot Orders ទាំងអស់ (Magic: \${botState.magicNumber}) — ចំណេញ/ខាត: \${closedProfit >= 0 ? '+' : ''}\${closedProfit} \${botState.account.currency}\`;
        saveBotConfig();
      } else {
        botState.statusMessageKhmer = '🛑 មិនមាន Order របស់ Bot ត្រូវបិទឡើយ';
      }
`;

code = code.replace(/    \} else if \(action === 'close_all'\) \{[\s\S]*?botState\.statusMessageKhmer = '🛑 មិនមាន Order របស់ Bot ត្រូវបិទឡើយ';\n      \}/, closeAllLogic.trim());
fs.writeFileSync('server.ts', code);
console.log('Action close logic updated');
