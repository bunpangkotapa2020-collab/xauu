const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldWatchdog = `setInterval(() => {
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

const newWatchdog = `setInterval(() => {
    const lastSeen = Math.max(botState.lastTickTime || 0, lastSyncTimestamp || 0);
    const tickAgeMs = lastSeen > 0 ? Date.now() - lastSeen : 0;
    const isRecentlyActive = lastSeen > 0 && (tickAgeMs < 60000);
    
    if (isRecentlyActive) {
        // Healthy heartbeat received within last 60s
        botState.account.serverConnected = true;
        botState.account.eaConnected = true;
        botState.account.vpsOnline = true;
        botState.account.marketDataReceiving = true;
        if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(true);
        if (!botState.marketDataStatus || botState.marketDataStatus.includes('🔴') || botState.marketDataStatus.includes('WAITING')) {
            botState.marketDataStatus = '🟢 LIVE (FEED ACTIVE)';
        }
    } else {
        // Market Data is stale or non-existent
        botState.account.marketDataReceiving = false;
        if (global.daraEngine) global.daraEngine.setMt5ConnectionStatus(false);
        
        if (lastSeen > 0) {
            if (tickAgeMs >= 60000) {
                botState.account.serverConnected = false;
                botState.account.eaConnected = false;
            }
            const ageText = \`\${Math.floor(tickAgeMs/1000)}s\`;
            botState.marketDataStatus = \`🔴 MT5 DATA DISCONNECTED (Delay: \${ageText})\`;
            if (Math.floor(tickAgeMs / 1000) % 60 === 0) {
                console.log(\`[MARKET_DATA] connection=STALE lastTickTime=\${lastSeen} tickAgeMs=\${tickAgeMs}\`);
            }
        } else {
            botState.marketDataStatus = botState.account.isConnected ? 'WATCHING / WAITING FOR LIVE DATA...' : '🔴 MT5 DATA DISCONNECTED (Delay: No Data)';
        }
    }
        
    // Auto-Recovery Tracking
    SelfHealingEngine.checkConnectionState(botState.account.serverConnected);
}, 1000);`;

content = content.replace(oldWatchdog, newWatchdog);
fs.writeFileSync('server.ts', content);
console.log('Fixed watchdog 2');
