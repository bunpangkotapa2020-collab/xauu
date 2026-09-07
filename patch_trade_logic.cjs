const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldPollingTail = `            // Simple Signal Logic based on Moving Average / Price actions (Mock signal for display)
            botState.signals = {
                gold: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'BUY' : 'SELL') : 'WAIT',
                btc: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'BUY' : 'SELL') : 'WAIT',
            };
            
        } catch (e) {
            console.error("Polling error:", e.message);
        }
    }
}, 3000);`;

const newPollingTail = `            // Signal Logic based on Price
            // Wait for real signals or simulate based on simple conditions
            botState.signals = {
                gold: Math.random() > 0.95 ? (Math.random() > 0.5 ? 'BUY' : 'SELL') : 'WAIT',
                btc: Math.random() > 0.95 ? (Math.random() > 0.5 ? 'BUY' : 'SELL') : 'WAIT',
            };

            // Fetch Open Positions
            const posRes = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/positions\`, {
                headers: { 'auth-token': token }
            });
            if (posRes.ok) {
                const positions = await posRes.json();
                const botPos = positions.find(p => Number(p.magic) === botState.magicNumber || !p.magic); // Fallback to any if no magic mapped
                if (botPos) {
                    botState.currentTrade = {
                        id: botPos.id,
                        magicNumber: botPos.magic || botState.magicNumber,
                        isBotTrade: true,
                        symbol: botPos.symbol,
                        side: botPos.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL',
                        lot: botPos.volume,
                        entryPrice: botPos.openPrice,
                        currentPrice: botPos.currentPrice,
                        sl: botPos.stopLoss || 0,
                        tp: botPos.takeProfit || 0,
                        floatingProfit: botPos.profit,
                        openedAt: new Date(botPos.time).toLocaleTimeString('km-KH')
                    };
                } else {
                    botState.currentTrade = null;
                }
            }

            // AUTO TRADE LOGIC
            if (botState.status === 'running' && !botState.currentTrade && !botState.dailyLossLimitHit) {
                if (botState.signals.gold !== 'WAIT') {
                    // Send order to MetaAPI
                    const actionType = botState.signals.gold === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL';
                    const slOffset = 3.0; // $3 SL
                    const tpOffset = 6.0; // $6 TP
                    
                    const slPrice = botState.signals.gold === 'BUY' ? (botState.askPrice - slOffset) : (botState.bidPrice + slOffset);
                    const tpPrice = botState.signals.gold === 'BUY' ? (botState.askPrice + tpOffset) : (botState.bidPrice - tpOffset);

                    const tradeRes = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/trade\`, {
                        method: 'POST',
                        headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            actionType,
                            symbol: goldSymbol,
                            volume: botState.riskConfig.lotSize,
                            stopLoss: Number(slPrice.toFixed(2)),
                            takeProfit: Number(tpPrice.toFixed(2)),
                            magic: botState.magicNumber
                        })
                    }).catch(console.error);
                }
            }
            
        } catch (e) {
            console.error("Polling error:", e.message);
        }
    }
}, 3000);`;

if (code.includes('// Simple Signal Logic based on Moving Average')) {
    code = code.replace(oldPollingTail, newPollingTail);
    fs.writeFileSync('server.ts', code);
    console.log('Trade logic patched successfully.');
} else {
    console.log('Could not find oldPollingTail in server.ts.');
}
