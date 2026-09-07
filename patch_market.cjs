const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const marketAwarenessCode = `
// ============================================
// MARKET AWARENESS LAYER (READ-ONLY)
// ============================================
let isMarketOpen = true; // Default assumption until fetched
let marketStatusReason = 'Initializing...';

async function checkActualMarketStatus() {
    const accountId = botState.account.metaApiAccountId;
    const token = botState.account.metaApiToken;
    const baseUrl = botState.account.metaApiUrl;

    if (!baseUrl || !accountId || !token || !botState.activeGoldSymbol) {
        return;
    }

    try {
        const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/symbols/\${botState.activeGoldSymbol}/specification\`, {
            headers: { 'auth-token': token }
        });
        
        if (res.ok) {
            const spec = await res.json();
            
            // Checking MT5 specification tradeMode and session status
            // 0 = SYMBOL_TRADE_MODE_DISABLED
            // 1 = SYMBOL_TRADE_MODE_LONGONLY
            // 2 = SYMBOL_TRADE_MODE_SHORTONLY
            // 3 = SYMBOL_TRADE_MODE_CLOSEONLY
            // 4 = SYMBOL_TRADE_MODE_FULL
            
            if (spec.tradeMode === 0 || spec.tradeMode === 'SYMBOL_TRADE_MODE_DISABLED') {
                isMarketOpen = false;
                marketStatusReason = 'Symbol Trade Disabled by Broker';
                return;
            }

            // A more direct way is checking if quotes are stale, or using the MetaApi current-price quote which might have a 'tradeable' flag.
            // Let's use the current-price API directly since it often contains session data.
            const priceRes = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/symbols/\${botState.activeGoldSymbol}/current-price\`, {
                headers: { 'auth-token': token }
            });

            if (priceRes.ok) {
                const quote = await priceRes.json();
                
                // If there's no quote or time is extremely stale (e.g. > 15 mins), the market is likely closed (weekend/holiday)
                const quoteTime = new Date(quote.time).getTime();
                const now = Date.now();
                
                if (now - quoteTime > 15 * 60 * 1000) {
                    isMarketOpen = false;
                    const date = new Date().getDay();
                    if (date === 0 || date === 6) {
                        marketStatusReason = 'Weekend Market Closed';
                    } else {
                        marketStatusReason = 'Market Holiday or Session Closed';
                    }
                    return;
                }
            }

            // Check day of week locally as a fallback safeguard
            const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
            const currentHour = new Date().getHours();
            
            // XAUUSD typically closes Friday ~ 23:59 (Server Time) and opens Sunday ~ 23:00 / Monday 00:00 (Server time). 
            // In Cambodia Time (ICT / UTC+7), Market closes Saturday ~ 4:00 AM and opens Monday ~ 5:00 AM
            if (dayOfWeek === 6 && currentHour >= 5) {
                isMarketOpen = false;
                marketStatusReason = 'Weekend Market Closed (Saturday)';
                return;
            }
            if (dayOfWeek === 0) {
                isMarketOpen = false;
                marketStatusReason = 'Weekend Market Closed (Sunday)';
                return;
            }
            if (dayOfWeek === 1 && currentHour < 4) {
                isMarketOpen = false;
                marketStatusReason = 'Weekend Market Closed (Early Monday)';
                return;
            }

            isMarketOpen = true;
            marketStatusReason = 'Market Open';
        }
    } catch (err) {
        console.error('Market Status Check Error:', err);
    }
}
`;

// Insert the new logic before executeAIAnalysis
code = code.replace(
    "async function executeAIAnalysis() {",
    marketAwarenessCode + "\nasync function executeAIAnalysis() {"
);

// Add the check inside the interval loop that fetches quotes, or inside executeAIAnalysis pre-flight check
const preFlightCheck = `
  await checkActualMarketStatus();
  botState.isMarketOpen = isMarketOpen; // save to state so UI can show it if needed
  
  if (!isMarketOpen) {
    botState.statusMessageKhmer = \`⏸️ [MARKET CLOSED] \${marketStatusReason} — រំលងការវិភាគ (Skip Analysis)\`;
    return;
  }
`;

code = code.replace(
    "if (!botState.currentCycle) botState.currentCycle = 1;",
    "if (!botState.currentCycle) botState.currentCycle = 1;\n" + preFlightCheck
);

fs.writeFileSync('server.ts', code);
