const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const trailingFunction = `
async function manageTrailingSL() {
    if (!botState.riskConfig.trailingStopEnabled) return;
    if (!botState.openTrades || botState.openTrades.length === 0) return;
    const activePrice = botState.askPrice || botState.goldPrice || 0;
    if (activePrice <= 0) return;

    for (let trade of botState.openTrades) {
        if (!trade.isBotTrade) continue;

        // Ensure variables exist
        if (!trade.highestPriceReached) trade.highestPriceReached = trade.entryPrice;
        if (!trade.lowestPriceReached) trade.lowestPriceReached = trade.entryPrice;

        // Calculate current RR distance
        const riskDistance = Math.abs(trade.entryPrice - (trade.sl || trade.entryPrice));
        if (riskDistance === 0) continue; // No SL set initially

        const tpDistance = Math.abs((trade.tp || trade.entryPrice) - trade.entryPrice);
        
        let shouldTrail = false;
        let newSl = trade.sl;

        if (trade.side === 'BUY') {
            trade.highestPriceReached = Math.max(trade.highestPriceReached, activePrice);
            // Did it reach RR 1:2.4? Wait, the target TP was set at RR 1:2.4 initially!
            // So if activePrice >= trade.tp, it reached the 1:2.4 target!
            if (activePrice >= (trade.tp || trade.entryPrice) && trade.tp > 0) {
                if (!trade.trailingActivated) {
                    trade.trailingActivated = true;
                    console.log(\`[NEW EA SMC] TARGET RR 1:2.4 REACHED - TRAILING SL ACTIVATED for BUY \${trade.id}\`);
                    botState.statusMessageKhmer = \`✅ TARGET RR 1:2.4 REACHED -> TRAILING SL ACTIVATED (BUY)\`;
                }
            }

            if (trade.trailingActivated) {
                // Lock profit and trail SL.
                // Distance to trail behind highest price (e.g., 50% of risk distance)
                const trailDistance = riskDistance * 0.5; 
                let potentialNewSl = trade.highestPriceReached - trailDistance;

                // Never move SL backward. SL must strictly be >= previous SL, and also > entryPrice + (spread buffer) if we want to lock profit
                if (potentialNewSl > trade.sl) {
                    newSl = Number(potentialNewSl.toFixed(2));
                    shouldTrail = true;
                }
            }
        } else if (trade.side === 'SELL') {
            trade.lowestPriceReached = Math.min(trade.lowestPriceReached, activePrice);
            
            if (activePrice <= (trade.tp || trade.entryPrice) && trade.tp > 0) {
                if (!trade.trailingActivated) {
                    trade.trailingActivated = true;
                    console.log(\`[NEW EA SMC] TARGET RR 1:2.4 REACHED - TRAILING SL ACTIVATED for SELL \${trade.id}\`);
                    botState.statusMessageKhmer = \`✅ TARGET RR 1:2.4 REACHED -> TRAILING SL ACTIVATED (SELL)\`;
                }
            }

            if (trade.trailingActivated) {
                const trailDistance = riskDistance * 0.5;
                let potentialNewSl = trade.lowestPriceReached + trailDistance;

                if (potentialNewSl < trade.sl || trade.sl === 0) {
                    newSl = Number(potentialNewSl.toFixed(2));
                    shouldTrail = true;
                }
            }
        }

        if (shouldTrail && newSl !== trade.sl) {
            trade.sl = newSl;
            trade.trailingSlValue = newSl;
            botState.statusMessageKhmer = \`🔒 PROFIT LOCKING -> SL TRAILING -> \${newSl}\`;
            
            // If connected to MetaApi, send modification request
            const accountId = botState.account.metaApiAccountId;
            const token = botState.account.metaApiToken;
            const baseUrl = botState.account.metaApiUrl;

            if (accountId && token && baseUrl && botState.account.serverConnected) {
                 fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/trade\`, {
                    method: 'POST',
                    headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        actionType: 'POSITION_MODIFY',
                        positionId: trade.id,
                        stopLoss: newSl
                    })
                 }).then(res => {
                     if (!res.ok) console.error(\`MetaApi Trail SL Update Failed for \${trade.id}\`);
                 }).catch(console.error);
            }
        }
    }
}
`;

if (!content.includes('async function manageTrailingSL')) {
    // Insert manageTrailingSL before executeAIAnalysis
    content = content.replace('async function executeAIAnalysis', trailingFunction + '\n\nasync function executeAIAnalysis');
    
    // Call manageTrailingSL inside the 3s polling loop (around line 1270, after botState.openTrades is set)
    content = content.replace(
        'botState.currentTrade = botState.openTrades[0] || null;',
        'botState.currentTrade = botState.openTrades[0] || null;\n                manageTrailingSL().catch(console.error);'
    );

    // Call manageTrailingSL inside the /api/mt5/sync route (around line 2771, after botState.openTrades is set)
    content = content.replace(
        'botState.currentTrade = botState.openTrades[0] || null;\n\n      // Auto New Cycle if all trades close',
        'botState.currentTrade = botState.openTrades[0] || null;\n      manageTrailingSL().catch(console.error);\n\n      // Auto New Cycle if all trades close'
    );

    fs.writeFileSync('server.ts', content);
    console.log('patched server.ts with trailing SL logic');
} else {
    console.log('already patched server.ts');
}
