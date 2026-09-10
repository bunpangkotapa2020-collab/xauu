
class DaRaServerBroker  {
    async sendOrder(order) {
        console.log(`[DaRa Broker] Executing ${order.type} for ${order.lot} lot...`);
        
        // ==========================================
        // FINAL LIVE TRADING SAFETY GUARD (SERVER-SIDE METAAPI GATE)
        // ==========================================
        if (!global.daraEngine) {
             const errorMsg = "HARD BLOCK: Engine not initialized.";
             console.error(`[DaRa Broker] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        if (global.daraEngine.isRunning !== true) {
             const errorMsg = "HARD BLOCK: Bot is NOT explicitly RUNNING. Execution aborted.";
             console.error(`[DaRa Broker] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        const settings = global.daraEngine.getUserSettings();
        if (settings.liveTradingEnabled !== true) {
             const errorMsg = "HARD BLOCK: liveTradingEnabled is NOT explicitly true. LIVE TRADING IS OFF. Execution aborted.";
             console.error(`[DaRa Broker] ❌ ${errorMsg}`);
             if (global.daraTelegram) {
                 global.daraTelegram.notify('⚠️ DaRa M1 EA - LIVE OFF', errorMsg).catch(() => {});
             }
             return { success: false, error: errorMsg };
        }
        // ==========================================
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
            const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/trade`, {
                method: 'POST',
                headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const responseText = await res.text();
            if (!res.ok) {
                return { success: false, error: `HTTP ${res.status} - ${responseText}` };
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
        
        // ==========================================
        // FINAL LIVE TRADING SAFETY GUARD (POSITION_MODIFY)
        // ==========================================
        if (!global.daraEngine) {
             const errorMsg = "HARD BLOCK: Engine not initialized.";
             console.error(`[DaRa Broker Modify] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        if (global.daraEngine.isRunning !== true) {
             const errorMsg = "HARD BLOCK: Bot is NOT explicitly RUNNING. Modify aborted.";
             console.error(`[DaRa Broker Modify] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        const settings = global.daraEngine.getUserSettings();
        if (settings.liveTradingEnabled !== true) {
             const errorMsg = "HARD BLOCK: liveTradingEnabled is NOT explicitly true. LIVE TRADING IS OFF. Modify aborted.";
             console.error(`[DaRa Broker Modify] ❌ ${errorMsg}`);
             if (global.daraTelegram) {
                 global.daraTelegram.notify('⚠️ DaRa M1 EA - LIVE OFF (MODIFY)', errorMsg).catch(() => {});
             }
             return { success: false, error: errorMsg };
        }
        if (!botState || !botState.account || botState.account.serverConnected !== true) {
             const errorMsg = "HARD BLOCK: Server is NOT connected.";
             console.error(`[DaRa Broker Modify] ❌ ${errorMsg}`);
             return { success: false, error: errorMsg };
        }
        // ==========================================
        
        try {
             const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/trade`, {
                 method: 'POST',
                 headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                 body: JSON.stringify(modifyPayload)
             });
             const responseText = await res.text();
             if (!res.ok) {
                 return { success: false, error: `HTTP ${res.status} - ${responseText}` };
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
        if (!accountId || !token || !baseUrl) return { pointSize: 0.01 };
        
        try {
            const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/symbols/${symbol}/specification`, {
                headers: { 'auth-token': token }
            });
            if (res.ok) {
                const spec = await res.json();
                return { pointSize: spec.pointSize || spec.point || 0.01 };
            }
        } catch (e) {
            console.error('[DaRa Broker] Failed to fetch symbol info:', e);
        }
        return { pointSize: 0.01 };
    }
}
module.exports = DaRaServerBroker;
