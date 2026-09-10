const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
const startStr = 'setInterval(() => {';
const endStr = '}, 1000);';
let idxStart = content.lastIndexOf(startStr);
if (idxStart !== -1) {
    let idxEnd = content.indexOf(endStr, idxStart);
    if (idxEnd !== -1) {
        let block = content.substring(idxStart, idxEnd + endStr.length);
        let replaceBlock = `setInterval(() => {
    const lastSeen = Math.max(botState.lastTickTime || 0, lastSyncTimestamp || 0);
    const tickAgeMs = lastSeen > 0 ? Date.now() - lastSeen : 0;
    const isRecentlyActive = lastSeen > 0 && (tickAgeMs < 60000);
    
    if (isRecentlyActive) {
        // Healthy heartbeat received within last 60s -> Keep all connection lights 100% stable GREEN
        botState.account.isConnected = true;
        botState.account.serverConnected = true;
        botState.account.eaConnected = true;
        botState.account.vpsOnline = true;
        botState.account.marketDataReceiving = true;
        if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(true);
        if (!botState.marketDataStatus || botState.marketDataStatus.includes('🔴')) {
            botState.marketDataStatus = '🟢 LIVE (FEED ACTIVE)';
        }
    } else {
        // True silence timeout (no data from MT5/EA for >60s)
        botState.account.isConnected = false;
        botState.account.serverConnected = false;
        botState.account.eaConnected = false;
        botState.account.marketDataReceiving = false;
        if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(false);
        const ageText = lastSeen > 0 ? \`\${Math.floor(tickAgeMs/1000)}s\` : 'No Data';
        botState.marketDataStatus = \`🔴 MT5 DATA DISCONNECTED (Delay: \${ageText})\`;
        if (lastSeen > 0 && Math.floor(tickAgeMs / 1000) % 60 === 0) {
            console.log(\`[MARKET_DATA] connection=DISCONNECTED lastTickTime=\${lastSeen} tickAgeMs=\${tickAgeMs} bid=\${botState.bidPrice} ask=\${botState.askPrice} dataFresh=false\`);
        }
    }
        
    // Auto-Recovery Tracking
    SelfHealingEngine.checkConnectionState(botState.account.serverConnected);
}, 1000);`;
        content = content.substring(0, idxStart) + replaceBlock + content.substring(idxEnd + endStr.length);
        fs.writeFileSync('server.ts', content);
        console.log('Replaced by string indexing successfully');
    }
}
