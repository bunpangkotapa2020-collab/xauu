const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /let isExecutingAIAnalysis = false;[\s\S]*?let currentAsk = botState\.askPrice/;

const replacement = `let isExecutingAIAnalysis = false;
async function executeAIAnalysis() {
  if (isExecutingAIAnalysis) {
    return; // Prevent duplicate concurrent AI analysis executions
  }
  isExecutingAIAnalysis = true;
  try {
    calculateVolatilityAndSpeed();
    lastAnalysisTimestamp = Date.now();
    const isRunning = botState.status === 'running';
    
    // 🟢 24/7 AUTO - Continuous Operation
    botState.isInsideTradingHours = true;

    if (!botState.account.isConnected || !botState.account.serverConnected) {
      if (isRunning) {
        botState.statusMessageKhmer = '🔴 [ICT EA] មិនទាន់ភ្ជាប់ MT5 Server — កំពុងរង់ចាំការតភ្ជាប់';
      }
      ictEaEngine.LIVE_TRADING_ENABLED = false;
      return;
    }

    // 🟢 Market Open/Closed Status Verification (Broker Level)
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

    // 🟢 LIVE_TRADING_ENABLED is true when bot is running AND market is open AND no safety limits hit
    const isSafeToTrade = isRunning && isMarketOpen && !botState.dailyLossLimitHit;
    ictEaEngine.LIVE_TRADING_ENABLED = isSafeToTrade;

    botState.selectedAsset = 'XAUUSD';
    const maxOpen = botState.riskConfig?.maxOpenTrades || 4;
    const currentOpenCount = (botState.openTrades || []).length;

    if (currentOpenCount >= maxOpen && isRunning) {
      botState.statusMessageKhmer = \`🟢 [ICT EA] គ្រប់គ្រង Trade សកម្ម (\${currentOpenCount}/\${maxOpen} Trades)\`;
      return;
    }

    let currentAsk = botState.askPrice`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log('Successfully updated executeAIAnalysis in server.ts');
} else {
  console.error('Regex match failed');
}
