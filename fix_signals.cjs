const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /botState\.signals = \{\s*gold: Math\.random\(\) > 0\.95[\s\S]*?btc: Math\.random\(\) > 0\.95[\s\S]*?\};/;

const replacement = `// REAL MOMENTUM AI LOGIC (M1 SCALPER)
            botState.tickHistory = botState.tickHistory || [];
            if (goldData) botState.tickHistory.push(botState.askPrice);
            if (botState.tickHistory.length > 20) botState.tickHistory.shift();

            let goldSignal = 'WAIT';
            if (botState.tickHistory.length >= 20 && !botState.currentTrade) {
                const startPrice = botState.tickHistory[0];
                const currentPrice = botState.tickHistory[botState.tickHistory.length - 1];
                const priceDiff = currentPrice - startPrice;
                
                // If price drops by 50 pips ($0.50) in last 20 ticks -> Buy Reversal
                if (priceDiff <= -0.50) {
                    goldSignal = 'BUY';
                    botState.tickHistory = []; // Reset
                } 
                // If price jumps by 50 pips ($0.50) in last 20 ticks -> Sell Reversal
                else if (priceDiff >= 0.50) {
                    goldSignal = 'SELL';
                    botState.tickHistory = []; // Reset
                }
            }

            botState.signals = {
                gold: goldSignal,
                btc: 'WAIT', // BTC logic disabled for now
            };`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log('Fixed Signal Logic');
} else {
    console.log('Regex did not match for signals');
}
