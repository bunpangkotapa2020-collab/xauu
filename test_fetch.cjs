const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCheck = `                if (quoteRes.ok) {
                    const quote = await quoteRes.json();`;

const newCheck = `                if (quoteRes.ok) {
                    const quote = await quoteRes.json();
                } else {
                    console.log(\`[MARKET_DATA] Quote fetch failed: \${quoteRes.status} \${quoteRes.statusText}\`);
                    if (quoteRes.status === 404 && primarySymbol === 'XAUUSDc') {
                        botState.activeGoldSymbol = 'XAUUSDm';
                    } else if (quoteRes.status === 404 && primarySymbol === 'XAUUSDm') {
                        botState.activeGoldSymbol = 'XAUUSD';
                    }
                }
                if (quoteRes.ok && await (async () => { try { return true } catch { return false } })()) {
                    // Let's just fix this properly using a regex or proper string replace
`;
// Let's do it cleanly
