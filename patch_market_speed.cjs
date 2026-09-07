const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Increase tickHistory length from 30 to 100
content = content.replace(/if \(botState\.tickHistory\.length > 30\)/g, 'if (botState.tickHistory.length > 100)');

// 2. Add calculateVolatilityAndSpeed function
const calcFunc = `
function calculateVolatilityAndSpeed() {
    botState.tickHistory = botState.tickHistory || [];
    if (botState.tickHistory.length < 10) {
        botState.marketSpeed = 'NORMAL';
        botState.volatilityValue = 0;
        return;
    }

    const prices = botState.tickHistory;
    let maxPrice = prices[0];
    let minPrice = prices[0];

    for (let i = 1; i < prices.length; i++) {
        if (prices[i] > maxPrice) maxPrice = prices[i];
        if (prices[i] < minPrice) minPrice = prices[i];
    }
    
    const range = maxPrice - minPrice;
    botState.volatilityValue = Number(range.toFixed(2));

    if (range >= 4.0 || botState.spreadPoints >= 40) {
        botState.marketSpeed = 'EXTREME';
    } else if (range >= 2.0 || botState.spreadPoints >= 25) {
        botState.marketSpeed = 'FAST';
    } else {
        botState.marketSpeed = 'NORMAL';
    }
}
`;

if (!content.includes('function calculateVolatilityAndSpeed')) {
    content = content.replace('async function executeAIAnalysis() {', calcFunc + '\nasync function executeAIAnalysis() {\n  calculateVolatilityAndSpeed();');
}

// 3. In executeAIAnalysis, block Extreme market
const extremeBlock = `
  if (botState.marketSpeed === 'EXTREME') {
      botState.statusMessageKhmer = \`⚠️ [NEW EA SMC] HIGH VOLATILITY (\${botState.volatilityValue}) — NO NEW ENTRY\`;
      return;
  }
`;
if (!content.includes("botState.marketSpeed === 'EXTREME'")) {
    content = content.replace(
        '  botState.selectedAsset = \'XAUUSD\';',
        extremeBlock + '\n  botState.selectedAsset = \'XAUUSD\';'
    );
}

fs.writeFileSync('server.ts', content);
console.log('patched market speed logic');
