const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Patch 1: Enhance the discrete reset endpoints
const oldResetEndpoints = `  app.post('/api/bot/reset-cooldown', requireAdminAuth, (req, res) => {
    if (global.daraEngine) {
      global.daraEngine.clearCooldown();
    }
    console.log('[LIVE_BACKEND] Cooldown explicitly reset by authorized user/admin.');
    res.json({ success: true, message: 'Cooldown cleared.' });
  });

  app.post('/api/bot/reset-consecutive-sl', requireAdminAuth, (req, res) => {
    if (global.daraEngine) {
      global.daraEngine.clearConsecutiveSL();
    }
    console.log('[LIVE_BACKEND] Consecutive SL explicitly reset by authorized user/admin.');
    res.json({ success: true, message: 'Consecutive SL cleared.' });
  });

  app.post('/api/bot/reset-daily-loss', requireAdminAuth, (req, res) => {
    if (global.daraEngine) {
      global.daraEngine.clearDailyLossLimit();
    }
    console.log('[LIVE_BACKEND] Daily Loss Limit explicitly reset by authorized user/admin.');
    res.json({ success: true, message: 'Daily Loss Limit cleared.' });
  });`;

const newResetEndpoints = `  app.post('/api/bot/reset-cooldown', requireAdminAuth, (req, res) => {
    if (global.daraEngine) {
      global.daraEngine.clearCooldown();
    }
    // Resume scanning if paused by this
    if (botState.status === 'paused' || botState.statusMessageKhmer?.includes('Cooldown')) {
        botState.status = 'running';
        botState.statusMessageKhmer = 'បានដកការការពារ Cooldown រួចរាល់។ (Bot Resumed)';
    }
    console.log('[LIVE_BACKEND] [AUDIT] Cooldown explicitly reset by authorized user/admin.');
    res.json({ success: true, message: 'Cooldown cleared. Bot is resuming scanning.' });
  });

  app.post('/api/bot/reset-consecutive-sl', requireAdminAuth, (req, res) => {
    if (global.daraEngine) {
      global.daraEngine.clearConsecutiveSL();
    }
    if (botState.status === 'paused' || botState.statusMessageKhmer?.includes('Max Consecutive')) {
        botState.status = 'running';
        botState.statusMessageKhmer = 'បានដកការការពារ Max Consecutive SL រួចរាល់។ (Bot Resumed)';
    }
    console.log('[LIVE_BACKEND] [AUDIT] Consecutive SL explicitly reset by authorized user/admin.');
    res.json({ success: true, message: 'Consecutive SL counter reset to 0. Bot is resuming scanning.' });
  });

  app.post('/api/bot/reset-daily-loss', requireAdminAuth, (req, res) => {
    if (global.daraEngine) {
      global.daraEngine.clearDailyLossLimit();
    }
    
    botState.dailyLossLimitHit = false;
    // CRITICAL: We do NOT set realizedDailyPnL or todayProfitLoss to 0. 
    // We keep the history, but we add an offset to the evaluation threshold so it allows new trades.
    botState.dailyLossResetOffset = botState.realizedDailyPnL;
    
    if (botState.status === 'paused' || botState.statusMessageKhmer?.includes('DAILY LOSS LIMIT')) {
        botState.status = 'running';
        botState.statusMessageKhmer = 'បានដកការការពារ Daily Loss Limit រួចរាល់។ (Bot Resumed)';
    }
    
    saveBotConfig();
    console.log('[LIVE_BACKEND] [AUDIT] Daily Loss Limit explicitly reset by authorized user/admin. Offset applied: ' + botState.dailyLossResetOffset);
    res.json({ success: true, message: 'Daily Loss Limit cleared. Bot is resuming scanning.' });
  });`;

code = code.replace(oldResetEndpoints, newResetEndpoints);

// Patch 2: Update the evaluation logic to use the offset
const oldEval = `                const totalDailyPnL = botState.realizedDailyPnL + totalFloating;
                const maxLoss = botState.riskConfig?.maxDailyLossAmount || botState.riskConfig?.maxDailyLoss || 2000;
                
                const currentMidnight = getCambodiaMidnightISO();
                if (botState.currentTradingDate && botState.currentTradingDate !== currentMidnight) {
                    // New trading day reset
                    botState.currentTradingDate = "";
                    botState.isDailyPnLSynced = false;
                    botState.dailyLossLimitHit = false;
                    lastPnLSyncTime = 0;
                } else if (botState.status === 'running' && maxLoss > 0 && totalDailyPnL <= -maxLoss) {`;

const newEval = `                const totalDailyPnL = botState.realizedDailyPnL + totalFloating;
                const adjustedDailyPnL = (botState.realizedDailyPnL - (botState.dailyLossResetOffset || 0)) + totalFloating;
                const maxLoss = botState.riskConfig?.maxDailyLossAmount || botState.riskConfig?.maxDailyLoss || 2000;
                
                const currentMidnight = getCambodiaMidnightISO();
                if (botState.currentTradingDate && botState.currentTradingDate !== currentMidnight) {
                    // New trading day reset
                    botState.currentTradingDate = "";
                    botState.isDailyPnLSynced = false;
                    botState.dailyLossLimitHit = false;
                    botState.dailyLossResetOffset = 0;
                    lastPnLSyncTime = 0;
                } else if (botState.status === 'running' && maxLoss > 0 && adjustedDailyPnL <= -maxLoss) {`;

code = code.replace(oldEval, newEval);

// Patch 3: Delete the old legacy reset_daily_limit from the /action endpoint
const legacyReset = `    } else if (action === 'reset_daily_limit') {
      botState.dailyLossLimitHit = false;
      botState.todayProfitLoss = 0;
      botState.realizedDailyPnL = 0;
      botState.currentTradingDate = "";
                    botState.isDailyPnLSynced = false;
      // Use current time as the new start time to ignore past losses for today
      botState.currentTradingDate = new Date().toISOString(); 
      botState.status = 'stopped';
      botState.statusMessageKhmer = 'បានកំណត់កម្រិតខាតប្រចាំថ្ងៃឡើងវិញ (Reset Daily Loss)';
      saveBotConfig();`;

const newLegacy = `    } else if (action === 'reset_daily_limit') {
      // Handled by /api/bot/reset-daily-loss instead to preserve history
      return res.status(400).json({ error: 'Deprecated endpoint. Use /api/bot/reset-daily-loss instead.' });`;

if (code.includes(legacyReset)) {
    code = code.replace(legacyReset, newLegacy);
}

fs.writeFileSync('server.ts', code);
console.log("Patched endpoints in server.ts");
