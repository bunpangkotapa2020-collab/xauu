const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

// Replace old EA instantiations with dummy/proxy for UI state compatibility
code = code.replace(
    /const ictEaEngine = new IctXauusdEA[^;]*;/g,
    'const ictEaEngine = { config: {}, state: {}, LIVE_TRADING_ENABLED: false };'
);
code = code.replace(
    /const ictMarketAdapter = new ICTRealMarketAdapter[^;]*;/g,
    'const ictMarketAdapter = null;'
);
code = code.replace(
    /ictEaEngine\.start\(\);/g,
    '// ictEaEngine.start(); removed'
);

// Remove the event handlers for ICT EA
code = code.replace(/ictEaEngine\.onSetupConfirmed = async \(data\) => \{[\s\S]*?\}\s*;/g, '');
code = code.replace(/ictEaEngine\.onActualEntryTriggered = async \(data\) => \{[\s\S]*?\}\s*;/g, '');
code = code.replace(/ictEaEngine\.onExecutionSuccess = async \(data\) => \{[\s\S]*?\}\s*;/g, '');
code = code.replace(/ictEaEngine\.onExecutionFailed = async \(data\) => \{[\s\S]*?\}\s*;/g, '');

// Remove the configuration updates to ictEaEngine
code = code.replace(/if \(typeof ictEaEngine !== 'undefined' && ictEaEngine\.config\) \{[\s\S]*?maxOpenTrades;\n\s*\}/g, '');
code = code.replace(/if \(typeof ictEaEngine !== 'undefined' && ictEaEngine\.config\) \{[\s\S]*?maxOpenTrades;\n\s*\}/g, ''); // run twice for both blocks

// Remove trailing logic
code = code.replace(/const potentialNewSl = ictEaEngine\.evaluateTrailingSL\([\s\S]*?\);/g, 'const potentialNewSl = trade.stopLoss;');
code = code.replace(/const isProfitLock = ictEaEngine\.isProfitLockActive\(trade\.id\);/g, 'const isProfitLock = false;');

// Remove LIVE_TRADING_ENABLED sets
code = code.replace(/ictEaEngine\.LIVE_TRADING_ENABLED = (true|false|isSafeToTrade);/g, '');
code = code.replace(/ictEaEngine\.liveTradingBlockReason = "[^"]*";/g, '');
code = code.replace(/ictEaEngine\.liveTradingBlockReason = "";/g, '');

// Remove tradeProfitLockState
code = code.replace(/if \(ictEaEngine\?\.tradeProfitLockState\) \{[\s\S]*?\}/g, '');
code = code.replace(/if \(ictEaEngine && ictEaEngine\.state\) \{[\s\S]*?\}/g, '');

// Fix any leftover LIVE_TRADING_ENABLED in logging
code = code.replace(/ictEaEngine\.LIVE_TRADING_ENABLED \? 'YES' : 'NO'/g, "global.daraEngine.getIsRunning() ? 'YES' : 'NO'");
code = code.replace(/\.\.\.ictEaEngine\.config,/g, '...botState.riskConfig,');

fs.writeFileSync('server.ts', code);
console.log('Old EA completely wiped from server.ts');
