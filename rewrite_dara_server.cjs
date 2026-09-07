const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

// Replace the instantiation of IctXauusdEA completely.
const targetEngineCreation = 'const ictEaEngine = new IctXauusdEA(ictEaConfig, ictNewsProvider, new RealMetaApiExecution());\nconst ictMarketAdapter = new ICTRealMarketAdapter(ictEaEngine);\nictEaEngine.start();';

const daraEngineCreation = `
// ============================================
// 🔥 DaRa M1 EA v1.0 INTEGRATION
// ============================================

class DaRaServerBroker {
    async sendOrder(order) {
        console.log(\`[DaRa Broker] Executing \${order.type} for \${order.lot} lot...\`);
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        
        if (!accountId || !token || !baseUrl) {
             return { success: false, error: "MetaApi not connected" };
        }
        
        const requestBody = {
            actionType: order.type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
            symbol: order.symbol,
            volume: order.lot,
            stopLoss: order.sl,
            takeProfit: order.tp,
            comment: order.comment
        };
        
        try {
            const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/trade\`, {
                method: 'POST',
                headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const responseText = await res.text();
            if (!res.ok) {
                return { success: false, error: \`HTTP \${res.status} - \${responseText}\` };
            }
            const data = JSON.parse(responseText);
            return { success: true, ticket: data.orderId || data.positionId || 'UNKNOWN' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async modifyPosition(ticket, newSl, newTp) {
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        
        if (!accountId || !token || !baseUrl) return { success: false, error: "MetaApi not connected" };
        
        const modifyPayload = {
             actionType: 'POSITION_MODIFY',
             positionId: ticket,
             stopLoss: newSl
        };
        if (newTp !== undefined) modifyPayload.takeProfit = newTp;
        
        try {
             const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/trade\`, {
                 method: 'POST',
                 headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                 body: JSON.stringify(modifyPayload)
             });
             const responseText = await res.text();
             if (!res.ok) {
                 return { success: false, error: \`HTTP \${res.status} - \${responseText}\` };
             }
             return { success: true };
        } catch (err) {
             return { success: false, error: err.message };
        }
    }

    async getOpenPositions(symbol) {
        return (botState.openTrades || []).filter(t => t.symbol === symbol).map(t => ({
            ticket: String(t.id),
            symbol: t.symbol,
            type: t.side,
            lot: t.volume,
            openPrice: t.entryPrice,
            currentPrice: t.currentPrice,
            sl: t.stopLoss || 0,
            tp: t.takeProfit || 0,
            openTime: new Date(t.openTime).getTime()
        }));
    }

    async getSymbolInfo(symbol) {
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        if (!accountId || !token || !baseUrl) return { pointSize: 0.001 };
        
        try {
            const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/symbols/\${symbol}/specification\`, {
                headers: { 'auth-token': token }
            });
            if (res.ok) {
                const spec = await res.json();
                return { pointSize: spec.pointSize || spec.point || (1 / Math.pow(10, spec.digits || 3)) };
            }
        } catch (e) {
            console.error('[DaRa Broker] Failed to fetch symbol info:', e);
        }
        return { pointSize: 0.001 }; // Default fallback for Cent accounts
    }
}

class DaRaServerTelegram {
    async notify(title, message) {
        if (typeof global.sendTelegramMessage === 'function') {
            global.sendTelegramMessage(\`\${title}\\n\\n\${message}\`).catch(() => {});
        } else {
            console.log(\`[DaRa Telegram] \${title}\\n\${message}\`);
        }
    }
}

const daraBroker = new DaRaServerBroker();
const daraTelegram = new DaRaServerTelegram();
global.daraEngine = new DaRaM1Engine(daraBroker, daraTelegram);
`;

code = code.replace(targetEngineCreation, daraEngineCreation);

// Now we need to find the tick injection block and replace ictMarketAdapter.processMarketData
// Actually, since we want to remove the old EA logic from the main loop:

const tickInjectionBlockRegex = /await ictMarketAdapter\.processMarketData\([^]*?symbolToTrade\s*\);/g;
const newTickInjection = `
        // Update DaRa User Settings
        global.daraEngine.updateUserSettings({
            lotSize: Number(botState.riskConfig?.lotSize || 0.10),
            slDistance: Number(botState.riskConfig?.stopLossPips || 10),
            tpDistance: Number(botState.riskConfig?.takeProfitPips || 8),
            dailyLossLimit: Number(botState.riskConfig?.maxDailyLossAmount || 2000),
            maxOpenTrades: Number(botState.riskConfig?.maxOpenTrades || 4),
            maxConsecutiveSL: Number(botState.riskConfig?.maxConsecutiveLosses || 6),
            cooldownMinutes: Number(botState.riskConfig?.cooldownMinutes || 20),
            maxSpreadPoints: Number(botState.riskConfig?.maxSpreadPoints || 25),
            newsFilterEnabled: botState.riskConfig?.newsFilterEnabled ?? true,
            newsMinsBefore: Number(botState.riskConfig?.minutesBeforeNewsBlock || 30),
            newsMinsAfter: Number(botState.riskConfig?.minutesAfterNewsBlock || 30),
            trailingEnabled: botState.riskConfig?.trailingStopEnabled ?? true,
            trailingTriggerPips: Number(botState.riskConfig?.trailingStopActivationPoints || 15),
            trailingDistancePips: Number(botState.riskConfig?.trailingStopDistancePoints || 5)
        });

        // Update Safety Context
        global.daraEngine.setNewsBlockedStatus(isNewsBlockedNow);
        global.daraEngine.setMt5ConnectionStatus(botState.account.serverConnected);

        // Forward tick
        await global.daraEngine.onMarketUpdate({
            symbol: symbolToTrade,
            bid: currentBid,
            ask: currentAsk,
            spreadPoints: botState.spreadPoints,
            serverTime: botState.lastTickTime || Date.now(),
            m1Candles: m1Candles
        });
        
        // Expose state to frontend
        const daraState = global.daraEngine.getState();
        const daraSetup = global.daraEngine.getCurrentSetup();
        
        if (isRunning) {
            botState.statusMessageKhmer = \`🔥 [DaRa M1 EA] \${daraState} | Setup: \${daraSetup ? daraSetup.direction : 'None'}\`;
        }
`;

code = code.replace(tickInjectionBlockRegex, newTickInjection);

// Now we need to remove the subsequent check on ictEaEngine:
const ictStateCheckRegex = /if \(ictEaEngine\.state\.currentSetup[^]*?statusMessageKhmer[^]*?\}/g;
code = code.replace(ictStateCheckRegex, '// ICT Status Message Removed');

// For the API routes, let's inject into the START / STOP action logic
const startActionCode = `
    } else if (action === 'start') {
        global.daraEngine.start();
`;
code = code.replace(/\} else if \(action === 'start'\) \{/, startActionCode);

const stopActionCode = `
    } else if (action === 'stop') {
        global.daraEngine.stop();
`;
code = code.replace(/\} else if \(action === 'stop'\) \{/, stopActionCode);

const closeAllActionCode = `
    } else if (action === 'close_all_trades') {
        global.daraEngine.stop();
`;
code = code.replace(/\} else if \(action === 'close_all_trades'\) \{/, closeAllActionCode);

fs.writeFileSync('server.ts', code);
console.log('Successfully rewrote server.ts with DaRa Integration');
