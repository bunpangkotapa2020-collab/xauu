const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetBlock = `    calculateVolatilityAndSpeed();
    lastAnalysisTimestamp = Date.now();
    const isRunning = botState.status === 'running';
    ictEaEngine.LIVE_TRADING_ENABLED = isRunning;

    if (!botState.account.isConnected || !botState.account.serverConnected) {
      if (isRunning) {
        botState.statusMessageKhmer = '🔴 [ICT EA] មិនទាន់ភ្ជាប់ MT5 Server — កំពុងរង់ចាំការតភ្ជាប់';
      }
      return;
    }

    if (isRunning) {
      if (!botState.isDailyPnLSynced) {
          botState.statusMessageKhmer = '⚠️ DAILY P/L UNKNOWN / RISK CHECK PAUSED — រង់ចាំទាញយកប្រវត្តិ P/L...';
          return;
      }
      
      if (botState.dailyLossLimitHit) {
          return;
      }

      if (botState.marketSpeed === 'EXTREME') {
          botState.statusMessageKhmer = \`⚠️ [ICT EA] HIGH VOLATILITY (\${botState.volatilityValue}) — NO NEW ENTRY\`;
          return;
      }
    }

    botState.selectedAsset = 'XAUUSD';
    const maxOpen = botState.riskConfig?.maxOpenTrades || 4;
    const currentOpenCount = (botState.openTrades || []).length;

    await checkActualMarketStatus();
     
    if (!isMarketOpen && isRunning) {
      botState.statusMessageKhmer = \`⏸️ [MARKET CLOSED] \${marketStatusReason} — រំលងការវិភាគ (Skip Analysis)\`;
      return;
    }

    const isInside = checkInsideTradingHours();
    botState.isInsideTradingHours = isInside;

    if (!isInside && isRunning) {
      botState.statusMessageKhmer = \`⏸️ [ICT EA] ក្រៅម៉ោងជួញដូរ — ផ្អាកបើក Trade ថ្មី\`;
      return;
    }`;

const newBlock = `    calculateVolatilityAndSpeed();
    lastAnalysisTimestamp = Date.now();
    const isRunning = botState.status === 'running';
    
    // 24/7 AUTO - Always inside trading hours
    botState.isInsideTradingHours = true;

    if (!botState.account.isConnected || !botState.account.serverConnected) {
      if (isRunning) {
        botState.statusMessageKhmer = '🔴 [ICT EA] មិនទាន់ភ្ជាប់ MT5 Server — កំពុងរង់ចាំការតភ្ជាប់';
      }
      ictEaEngine.LIVE_TRADING_ENABLED = false;
      return;
    }

    // Market Open / Closed Status Check
    await checkActualMarketStatus();
     
    if (!isMarketOpen) {
      if (isRunning) {
        botState.statusMessageKhmer = \`⏸️ [MARKET CLOSED] WAITING FOR MARKET OPEN (\${marketStatusReason})\`;
      }
      ictEaEngine.LIVE_TRADING_ENABLED = false;
      return;
    }

    if (isRunning) {
      if (!botState.isDailyPnLSynced) {
          botState.statusMessageKhmer = '⚠️ DAILY P/L UNKNOWN / RISK CHECK PAUSED — រង់ចាំទាញយកប្រវត្តិ P/L...';
          ictEaEngine.LIVE_TRADING_ENABLED = false;
          return;
      }
      
      if (botState.dailyLossLimitHit) {
          ictEaEngine.LIVE_TRADING_ENABLED = false;
          return;
      }

      if (botState.marketSpeed === 'EXTREME') {
          botState.statusMessageKhmer = \`⚠️ [ICT EA] HIGH VOLATILITY (\${botState.volatilityValue}) — NO NEW ENTRY\`;
          ictEaEngine.LIVE_TRADING_ENABLED = false;
          return;
      }
    }

    // When Market is Open and Bot is Running (Safe to trade 24/7)
    const isSafeToTrade = isRunning && isMarketOpen && !botState.dailyLossLimitHit;
    ictEaEngine.LIVE_TRADING_ENABLED = isSafeToTrade;

    botState.selectedAsset = 'XAUUSD';
    const maxOpen = botState.riskConfig?.maxOpenTrades || 4;
    const currentOpenCount = (botState.openTrades || []).length;`;

if (code.includes(targetBlock)) {
  code = code.replace(targetBlock, newBlock);
  fs.writeFileSync('server.ts', code);
  console.log('Successfully replaced executeAIAnalysis gate block in server.ts');
} else {
  console.error('Target block not found');
}
