const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /async function manageTrailingSL\(\) \{[\s\S]*?\}\n\}\n/m;

const newManageTrailingSL = `async function manageTrailingSL() {
    if (!botState.riskConfig.trailingStopEnabled) return;
    if (!botState.openTrades || botState.openTrades.length === 0) return;
    
    const activePrice = botState.askPrice || botState.goldPrice || 0;
    if (activePrice <= 0) return;

    for (let trade of botState.openTrades) {
        if (!trade.isBotTrade) continue;
        
        // Initial distance is the absolute risk distance if SL was set. Default to 10 if unknown.
        const initialSlDistance = (trade.sl && trade.sl !== 0) 
            ? Math.abs(trade.entryPrice - trade.sl) 
            : 10.0;
            
        const potentialNewSl = ictEaEngine.evaluateTrailingSL(
            trade.id,
            trade.side as 'BUY'|'SELL',
            trade.entryPrice,
            trade.sl || 0,
            activePrice,
            initialSlDistance,
            ictEaEngine.lastM1Candles || []
        );
        
        if (potentialNewSl !== null && potentialNewSl !== trade.sl && potentialNewSl !== 0) {
            trade.sl = potentialNewSl;
            trade.trailingSlValue = potentialNewSl;
            botState.statusMessageKhmer = \`🔒 PROFIT LOCKING -> SL TRAILING -> \${potentialNewSl}\`;
            
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
                        stopLoss: potentialNewSl
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

// Also remove the manual configuration bindings in the main interval
code = code.replace(/       ictEaEngine.config.trailingStopActivationPoints = botState.riskConfig\?.trailingStopActivationPoints \?\? 20;\n/g, "");
code = code.replace(/       ictEaEngine.config.trailingStopDistancePoints = botState.riskConfig\?.trailingStopDistancePoints \?\? 10;\n/g, "");

fs.writeFileSync('server.ts', code);
