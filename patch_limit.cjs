const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const limitLogic = `
            // ==== DAILY LOSS LIMIT EVALUATION ====
            if (botState.isDailyPnLSynced && botState.status === 'running') {
                let totalFloating = 0;
                for (const pos of botState.openTrades) {
                    totalFloating += pos.floatingProfit + (pos.commission || 0) + (pos.swap || 0);
                }
                const totalDailyPnL = botState.realizedDailyPnL + totalFloating;
                const maxLoss = Number(botState.riskConfig.maxDailyLoss || 0);
                
                const currentMidnight = getCambodiaMidnightISO();
                if (botState.currentTradingDate && botState.currentTradingDate !== currentMidnight) {
                    // New trading day reset
                    botState.isDailyPnLSynced = false;
                    botState.dailyLossLimitHit = false;
                    lastPnLSyncTime = 0;
                } else if (maxLoss > 0 && totalDailyPnL <= -maxLoss) {
                    botState.dailyLossLimitHit = true;
                    if (!botState.statusMessageKhmer.includes('DAILY LOSS LIMIT HIT')) {
                         botState.statusMessageKhmer = \`🛑 DAILY LOSS LIMIT HIT / TRADING PAUSED (P/L: \${totalDailyPnL.toFixed(2)}$)\`;
                    }
                } else {
                    botState.dailyLossLimitHit = false;
                }
                
                // Expose to UI so it's visible dynamically
                botState.todayProfitLoss = Number(totalDailyPnL.toFixed(2));
            }
            // =======================================
`;

code = code.replace(
    "            // Check Risk Protection (Cooldown / Volatility)",
    limitLogic + "\n            // Check Risk Protection (Cooldown / Volatility)"
);

fs.writeFileSync('server.ts', code);
