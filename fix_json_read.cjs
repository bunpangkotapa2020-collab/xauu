const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCheck = `                if (quoteRes.ok) {
                    const quote = await quoteRes.json();
                } else {
                    if (quoteRes.status === 404) {
                        if (primarySymbol === 'XAUUSDc') botState.activeGoldSymbol = 'XAUUSDm';
                        else if (primarySymbol === 'XAUUSDm') botState.activeGoldSymbol = 'XAUUSD';
                        else if (primarySymbol === 'XAUUSD') botState.activeGoldSymbol = 'GOLD';
                        else if (primarySymbol === 'GOLD') botState.activeGoldSymbol = 'XAUUSDc';
                    }
                }
                if (quoteRes.ok) {
                    const quote = await quoteRes.json(); fs.appendFileSync("quote_errors.log", \`Quote: \${JSON.stringify(quote)}\\n\`);`;

const newCheck = `                let quote = null;
                if (quoteRes.ok) {
                    quote = await quoteRes.json();
                } else {
                    if (quoteRes.status === 404) {
                        if (primarySymbol === 'XAUUSDc') botState.activeGoldSymbol = 'XAUUSDm';
                        else if (primarySymbol === 'XAUUSDm') botState.activeGoldSymbol = 'XAUUSD';
                        else if (primarySymbol === 'XAUUSD') botState.activeGoldSymbol = 'GOLD';
                        else if (primarySymbol === 'GOLD') botState.activeGoldSymbol = 'XAUUSDc';
                    }
                }
                if (quoteRes.ok && quote) {`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('server.ts', code);
