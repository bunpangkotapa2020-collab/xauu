const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /async function manageTrailingSL\(\) \{[\s\S]*?\}\n\}\n/m;

const newManageTrailingSL = `async function manageTrailingSL() {
    if (!botState.riskConfig.trailingStopEnabled) return;
    if (!botState.openTrades || botState.openTrades.length === 0) return;
    
    const activePrice = botState.askPrice || botState.goldPrice || 0;
    if (activePrice <= 0) return;
    
    const actPts = botState.riskConfig.trailingStopActivationPoints || 20;
    const distPts = botState.riskConfig.trailingStopDistancePoints || 10;
    const beEnabled = botState.riskConfig.trailingStopBreakEven ?? true;
    const beOffset = botState.riskConfig.trailingStopBreakEvenOffset || 2;

    for (let trade of botState.openTrades) {
        if (!trade.isBotTrade) continue;
        if (!trade.highestPriceReached) trade.highestPriceReached = trade.entryPrice;
        if (!trade.lowestPriceReached) trade.lowestPriceReached = trade.entryPrice;
        
        let shouldTrail = false;
        let newSl = trade.sl;
        
        if (trade.side === 'BUY') {
            trade.highestPriceReached = Math.max(trade.highestPriceReached, activePrice);
            const profitPoints = trade.highestPriceReached - trade.entryPrice;
            
            // Break Even Logic
            if (beEnabled && profitPoints >= actPts && (trade.sl < trade.entryPrice)) {
                let beSl = trade.entryPrice + beOffset;
                if (beSl > trade.sl) {
                    newSl = Number(beSl.toFixed(2));
                    shouldTrail = true;
                }
            }
            
            // Standard Trailing Logic
            if (profitPoints >= actPts) {
                let potentialNewSl = trade.highestPriceReached - distPts;
                // SL can only move UP for BUY
                if (potentialNewSl > (newSl || trade.sl)) {
                    newSl = Number(potentialNewSl.toFixed(2));
                    shouldTrail = true;
                }
            }
            
        } else if (trade.side === 'SELL') {
            trade.lowestPriceReached = Math.min(trade.lowestPriceReached, activePrice);
            const profitPoints = trade.entryPrice - trade.lowestPriceReached;
            
            // Break Even Logic
            if (beEnabled && profitPoints >= actPts && (trade.sl === 0 || trade.sl > trade.entryPrice)) {
                let beSl = trade.entryPrice - beOffset;
                if (trade.sl === 0 || beSl < trade.sl) {
                    newSl = Number(beSl.toFixed(2));
                    shouldTrail = true;
                }
            }
            
            // Standard Trailing Logic
            if (profitPoints >= actPts) {
                let potentialNewSl = trade.lowestPriceReached + distPts;
                // SL can only move DOWN for SELL
                if (trade.sl === 0 || potentialNewSl < (newSl || trade.sl)) {
                    newSl = Number(potentialNewSl.toFixed(2));
                    shouldTrail = true;
                }
            }
        }
        
        if (shouldTrail && newSl !== trade.sl && newSl !== 0) {
            trade.sl = newSl;
            trade.trailingSlValue = newSl;
            botState.statusMessageKhmer = \`🔒 PROFIT LOCKING -> SL TRAILING -> \${newSl}\`;
            
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

code = code.replace(regex, newManageTrailingSL);
fs.writeFileSync('server.ts', code);
