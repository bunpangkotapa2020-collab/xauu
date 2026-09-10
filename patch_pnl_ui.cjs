const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// 1. Remove botState.status === 'running' restriction for syncing PnL
const oldSyncLogic = `    if (botState.status === 'running' && (now - lastPnLSyncTime >= 60000 || !botState.isDailyPnLSynced)) {
        lastPnLSyncTime = now;
        syncDailyRealizedPnL().catch(console.error);
    }`;
const newSyncLogic = `    if (now - lastPnLSyncTime >= 60000 || !botState.isDailyPnLSynced) {
        lastPnLSyncTime = now;
        syncDailyRealizedPnL().catch(console.error);
    }`;
code = code.replace(oldSyncLogic, newSyncLogic);

// 2. Remove botState.status === 'running' restriction for DAILY LOSS LIMIT EVALUATION but keep it for triggering the hit
const oldEvalLogic = `            // ==== DAILY LOSS LIMIT EVALUATION ====
            if (botState.isDailyPnLSynced && botState.status === 'running') {
                let totalFloating = 0;
                for (const pos of botState.openTrades) {
                    totalFloating += pos.floatingProfit + (pos.commission || 0) + (pos.swap || 0);
                }
                const totalDailyPnL = botState.realizedDailyPnL + totalFloating;
                const maxLoss = 2000; // FIXED CAP: 2000 USC
                
                const currentMidnight = getCambodiaMidnightISO();
                if (botState.currentTradingDate && botState.currentTradingDate !== currentMidnight) {
                    // New trading day reset
                    botState.currentTradingDate = "";
                    botState.isDailyPnLSynced = false;
                    botState.dailyLossLimitHit = false;
                    lastPnLSyncTime = 0;
                } else if (maxLoss > 0 && totalDailyPnL <= -maxLoss) {
                    botState.dailyLossLimitHit = true;
                    if (!botState.statusMessageKhmer.includes('DAILY LOSS LIMIT HIT')) {
                         botState.statusMessageKhmer = \`🛑 DAILY LOSS LIMIT HIT / TRADING PAUSED (P/L: \${totalDailyPnL.toFixed(2)} \${botState.account.currency || 'USC'})\`;
                    }
                } else {
                    botState.dailyLossLimitHit = false;
                }
                
                // Expose to UI so it's visible dynamically
                botState.todayProfitLoss = Number(totalDailyPnL.toFixed(2));
            }`;

const newEvalLogic = `            // ==== DAILY LOSS LIMIT EVALUATION ====
            if (botState.isDailyPnLSynced) {
                let totalFloating = 0;
                for (const pos of botState.openTrades) {
                    totalFloating += pos.floatingProfit + (pos.commission || 0) + (pos.swap || 0);
                }
                const totalDailyPnL = botState.realizedDailyPnL + totalFloating;
                const maxLoss = 2000; // FIXED CAP: 2000 USC
                
                const currentMidnight = getCambodiaMidnightISO();
                if (botState.currentTradingDate && botState.currentTradingDate !== currentMidnight) {
                    // New trading day reset
                    botState.currentTradingDate = "";
                    botState.isDailyPnLSynced = false;
                    botState.dailyLossLimitHit = false;
                    lastPnLSyncTime = 0;
                } else if (botState.status === 'running' && maxLoss > 0 && totalDailyPnL <= -maxLoss) {
                    botState.dailyLossLimitHit = true;
                    if (!botState.statusMessageKhmer.includes('DAILY LOSS LIMIT HIT')) {
                         botState.statusMessageKhmer = \`🛑 DAILY LOSS LIMIT HIT / TRADING PAUSED (P/L: \${totalDailyPnL.toFixed(2)} \${botState.account.currency || 'USC'})\`;
                    }
                } else if (totalDailyPnL > -maxLoss) {
                    botState.dailyLossLimitHit = false;
                }
                
                // Expose to UI so it's visible dynamically
                botState.todayProfitLoss = Number(totalDailyPnL.toFixed(2));
            }`;

code = code.replace(oldEvalLogic, newEvalLogic);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts to sync PnL even when stopped.");
