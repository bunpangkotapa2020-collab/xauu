const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newCode = `
     botState.btcAskPrice = Number((botState.btcPrice + (btcSpread)).toFixed(2));
     botState.lastPriceUpdate = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

     // Update Equity dynamically based on floating profit
     if (botState.currentTrade) {
        botState.account.equity = Number((botState.account.balance + botState.currentTrade.floatingProfit).toFixed(2));
     } else {
        botState.account.equity = botState.account.balance;
     }
  }
}, 3000);
`;

code = code.replace(
  `     botState.btcAskPrice = Number((botState.btcPrice + (btcSpread)).toFixed(2));
     botState.lastPriceUpdate = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}, 3000);`, 
  newCode
);

fs.writeFileSync('server.ts', code);
