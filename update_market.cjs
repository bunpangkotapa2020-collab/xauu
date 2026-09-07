const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

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
fs.writeFileSync('server.ts', code);
console.log('Market interval updated');
