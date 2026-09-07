const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const hookStr = `const initialSavedConfig = loadOrCreateBotConfig();`;
const hookReplacement = `const initialSavedConfig = loadOrCreateBotConfig();

// Simulated Market Data Feed (Backend)
setInterval(() => {
  if (botState.account.isConnected) {
     // simulate slight price movement
     const direction = Math.random() > 0.5 ? 1 : -1;
     const change = Math.random() * 0.5; // up to $0.50 change
     botState.goldPrice = Number((botState.goldPrice + (direction * change)).toFixed(2));
     botState.bidPrice = botState.goldPrice;
     botState.spreadPoints = Math.floor(Math.random() * (18 - 8 + 1)) + 8; // spread 8-18 points
     botState.askPrice = Number((botState.goldPrice + (botState.spreadPoints / 100)).toFixed(2));
     botState.lastPriceUpdate = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}, 3000);
`;

if (code.includes(hookStr) && !code.includes('Simulated Market Data Feed')) {
  code = code.replace(hookStr, hookReplacement);
  fs.writeFileSync('server.ts', code);
  console.log('Patched price feed');
} else {
  console.log('Hook not found or already patched');
}
