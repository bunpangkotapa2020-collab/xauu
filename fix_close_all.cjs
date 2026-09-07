const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldClose = `    } else if (action === 'close_all') {
      if (botState.currentTrade && botState.currentTrade.magicNumber === botState.magicNumber) {
        const closedProfit = botState.currentTrade.floatingProfit;
        const tradeId = botState.currentTrade.id;
        
        let success = true;
        if (tradeId && tradeId !== 'PENDING') {
           success = await closeRealTrade(tradeId);
        }

        if (success) {
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
            botState.statusMessageKhmer = '🔴 បរាជ័យក្នុងការបិទ Trade នៅលើ Real Server';
        }
      }
    }`;

const newClose = `    } else if (action === 'close_all') {
      if (botState.openTrades && botState.openTrades.length > 0) {
        let totalClosedProfit = 0;
        let closedCount = 0;
        
        for (const trade of botState.openTrades) {
          if (trade.magicNumber === botState.magicNumber) {
             const success = await closeRealTrade(trade.id);
             if (success) {
                totalClosedProfit += trade.floatingProfit;
                closedCount++;
             }
          }
        }

        if (closedCount > 0) {
            botState.todayProfitLoss = Number((botState.todayProfitLoss + totalClosedProfit).toFixed(2));
            botState.account.balance = Number((botState.account.balance + totalClosedProfit).toFixed(2));
            botState.account.equity = botState.account.balance;
            botState.todayTradeCount += closedCount;
            if (totalClosedProfit >= 0) botState.todayWinCount += closedCount;
            else botState.todayLossCount += closedCount;
            botState.currentTrade = null;
            botState.openTrades = [];
            botState.statusMessageKhmer = \`🛑 បានបិទរាល់ Bot Orders ចំនួន \${closedCount} (Magic: \${botState.magicNumber}) — ចំណេញ/ខាតសរុប: \${totalClosedProfit >= 0 ? '+' : ''}\${totalClosedProfit.toFixed(2)} \${botState.account.currency}\`;
            saveBotConfig();
        } else {
            botState.statusMessageKhmer = '🔴 បរាជ័យក្នុងការបិទ Trade នៅលើ Real Server ឫគ្មាន Trade សម្រាប់បិទ';
        }
      } else {
        botState.statusMessageKhmer = 'គ្មាន Bot Orders សម្រាប់បិទទេ';
      }
    }`;

code = code.replace(oldClose, newClose);
fs.writeFileSync('server.ts', code);
