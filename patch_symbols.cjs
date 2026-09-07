const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Fetch Market Data \(XAUUSDm or XAUUSDc\)[\s\S]*?botState\.lastPriceUpdate = new Date\(\)\.toLocaleTimeString\('km-KH', \{ hour: '2-digit', minute: '2-digit', second: '2-digit' \}\);/g;

const replacement = `// Fetch Market Data with Symbol Fallbacks
            const possibleGoldSymbols = ['XAUUSDm', 'XAUUSDc', 'XAUUSD', 'GOLD'];
            const possibleBtcSymbols = ['BTCUSDm', 'BTCUSDc', 'BTCUSD'];
            
            // Function to fetch quote with fallback
            const fetchQuote = async (symbols) => {
                for (const sym of symbols) {
                    const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/symbols/\${sym}/current-quote\`, {
                        headers: { 'auth-token': token }
                    }).catch(() => null);
                    if (res && res.ok) {
                        const quote = await res.json();
                        return { symbol: sym, quote };
                    }
                }
                return null;
            };

            const goldData = await fetchQuote(possibleGoldSymbols);
            if (goldData) {
                botState.goldPrice = goldData.quote.bid;
                botState.bidPrice = goldData.quote.bid;
                botState.askPrice = goldData.quote.ask;
                botState.spreadPoints = Math.round((goldData.quote.ask - goldData.quote.bid) * 100);
            }

            const btcData = await fetchQuote(possibleBtcSymbols);
            if (btcData) {
                botState.btcPrice = btcData.quote.bid;
                botState.btcBidPrice = btcData.quote.bid;
                botState.btcAskPrice = btcData.quote.ask;
            }

            if (goldData || btcData) {
                botState.lastPriceUpdate = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log('patched symbols logic');
} else {
    console.log('regex not matched in server.ts');
}
