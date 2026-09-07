const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldLogicStart = code.indexOf('// Signal Logic based on Price');
const oldLogicEnd = code.indexOf('} catch (e) {', oldLogicStart);

if (oldLogicStart === -1 || oldLogicEnd === -1) {
  console.log('Could not find logic block!');
  process.exit(1);
}

const newLogic = `
            // Check Trading Session
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            const startHour = botState.tradingHours?.startHour || "00:00";
            const stopHour = botState.tradingHours?.stopHour || "23:59";
            if (botState.tradingHours?.enabled) {
              if (startHour <= stopHour) {
                botState.isInsideTradingHours = currentHour >= startHour && currentHour <= stopHour;
              } else {
                botState.isInsideTradingHours = currentHour >= startHour || currentHour <= stopHour;
              }
            } else {
              botState.isInsideTradingHours = true;
            }

            // Fetch Open Positions
            const posRes = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/positions\`, {
                headers: { 'auth-token': token }
            }).catch(() => null);
            
            if (posRes && posRes.ok) {
                const positions = await posRes.json();
                botState.openTrades = positions.filter((p) => Number(p.magic) === botState.magicNumber).map(botPos => ({
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
                }));
                botState.currentTrade = botState.openTrades[0] || null;
                
                // Track loss and cooldown
                const totalProfit = botState.openTrades.reduce((sum, t) => sum + t.floatingProfit, 0);
                // In a real app we'd track closed trades for consecutive losses, here we simulate if floating profit drops low
                // For simplicity, we just keep the status as running if no limits are hit.
            }

            // Signal Logic based on Price
            botState.tickHistory = botState.tickHistory || [];
            if (goldData) botState.tickHistory.push(botState.askPrice);
            if (botState.tickHistory.length > 20) botState.tickHistory.shift();
            
            let goldSignal = 'WAIT';
            let btcSignal = 'WAIT';
            
            // Generate basic AI signal if we have enough ticks and haven't hit max trades
            const maxOpen = botState.riskConfig?.maxOpenTrades || 4;
            if (botState.tickHistory.length >= 5 && botState.openTrades.length < maxOpen) {
                const startPrice = botState.tickHistory[botState.tickHistory.length - 5];
                const currentPrice = botState.tickHistory[botState.tickHistory.length - 1];
                const priceDiff = currentPrice - startPrice;
                
                // If price drops quickly -> Buy
                if (priceDiff <= -0.20) {
                    goldSignal = 'BUY';
                } 
                // If price jumps quickly -> Sell
                else if (priceDiff >= 0.20) {
                    goldSignal = 'SELL';
                }
            }
            
            botState.signals = {
                gold: goldSignal,
                btc: btcSignal,
            };

            // AUTO TRADE LOGIC
            const canTrade = botState.status === 'running' 
                && !botState.dailyLossLimitHit 
                && botState.account.serverConnected
                && botState.isInsideTradingHours
                && botState.openTrades.length < maxOpen;

            if (canTrade) {
                if (botState.signals.gold !== 'WAIT') {
                    const actionType = botState.signals.gold === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL';
                    const slOffset = (botState.riskConfig?.stopLossPips || 30) / 10;
                    const tpOffset = (botState.riskConfig?.takeProfitPips || 60) / 10;
                    
                    const slPrice = botState.signals.gold === 'BUY' ? (botState.askPrice - slOffset) : (botState.bidPrice + slOffset);
                    const tpPrice = botState.signals.gold === 'BUY' ? (botState.askPrice + tpOffset) : (botState.bidPrice - tpOffset);
                    const volume = botState.riskConfig?.lotSize || 0.01;
                    
                    botState.signalDetails = {
                       side: botState.signals.gold,
                       symbol: botState.activeGoldSymbol || 'XAUUSD',
                       entry: botState.signals.gold === 'BUY' ? botState.askPrice : botState.bidPrice,
                       lot: volume,
                       sl: slPrice,
                       tp: tpPrice,
                       risk: botState.riskConfig?.maxDailyLossPercent || 1,
                       count: botState.openTrades.length + 1
                    };

                    const tradeRes = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/trade\`, {
                        method: 'POST',
                        headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            actionType,
                            symbol: botState.activeGoldSymbol || (botState.account.accountType === 'cent' ? 'XAUUSDc' : 'XAUUSDm'),
                            volume: volume,
                            stopLoss: Number(slPrice.toFixed(2)),
                            takeProfit: Number(tpPrice.toFixed(2)),
                            magic: botState.magicNumber
                        })
                    }).catch(console.error);
                    
                    // Reset history after signal to prevent spamming
                    botState.tickHistory = [];
                } else {
                   botState.signalDetails = undefined;
                }
            } else {
                botState.signalDetails = undefined;
            }
            
            // Check Risk Protection (Cooldown / Volatility)
            // Just simulate high volatility pause if spread is huge
            if (botState.spreadPoints > (botState.riskConfig?.maxSpreadPoints || 50)) {
               if (botState.status === 'running') {
                  botState.status = 'paused';
                  botState.statusMessageKhmer = '🟠 HIGH VOLATILITY — NEW TRADES PAUSED';
               }
            } else if (botState.status === 'paused' && botState.spreadPoints <= (botState.riskConfig?.maxSpreadPoints || 50)) {
               // Auto Resume
               botState.status = 'running';
               botState.statusMessageKhmer = '🟢 MARKET NORMAL — BOT RESUMED';
            }

        `;

code = code.substring(0, oldLogicStart) + newLogic + code.substring(oldLogicEnd);
fs.writeFileSync('server.ts', code);
