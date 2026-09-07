const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

// The block to replace
const startMarker = '        // Update config settings dynamically if they change from UI';
const endMarker = '           botState.signalDetails = undefined;\n        }';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find block to replace");
    process.exit(1);
}

const newBlock = `        // Update DaRa User Settings
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
        
        if (daraSetup) {
           botState.signals = { gold: daraSetup.direction };
           botState.signalDetails = {
               side: daraSetup.direction,
               entry: daraSetup.lockedEntryPrice,
               actualEntry: daraSetup.lockedEntryPrice,
               sl: daraSetup.virtualSLPrice,
               tp: daraSetup.virtualTPPrice,
               stage: daraState,
               executionState: daraState,
               ticket: daraSetup.status === 'EXECUTED' ? 'Yes' : undefined,
               obHigh: daraSetup.mssLevel,
               obLow: daraSetup.sweepLevel
           };
        } else {
           botState.signals = { gold: 'WAIT' };
           botState.signalDetails = undefined;
        }`;

code = code.substring(0, startIndex) + newBlock + code.substring(endIndex + endMarker.length);

// Also remove `ictEaEngine` references in the telemetry export
code = code.replace(/if \(ictEaEngine && typeof ictEaEngine\.getTelemetry === 'function'\) \{[\s\S]*?botState\.ictAnalysis = ictEaEngine\.getTelemetry\(botState\);\n    \}/g, '// telemetry removed');

code = code.replace(/LIVE_TRADING_ENABLED: ictEaEngine\.LIVE_TRADING_ENABLED/g, "LIVE_TRADING_ENABLED: global.daraEngine.getIsRunning()");
code = code.replace(/ictEaEngine\.state\.currentSetup/g, "global.daraEngine.getCurrentSetup()");

fs.writeFileSync('server.ts', code);
console.log("Patch applied");
