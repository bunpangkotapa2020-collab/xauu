const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startMarker = 'async function executeAIAnalysis() {';
const endMarker = '// DEDICATED 1-MINUTE AI ANALYSIS TIMER';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newFunction = `async function executeAIAnalysis() {
  calculateVolatilityAndSpeed();
  lastAnalysisTimestamp = Date.now();

  if (botState.status !== 'running') {
    return;
  }

  if (!botState.account.isConnected || !botState.account.serverConnected) {
    botState.statusMessageKhmer = '🔴 [ICT EA] មិនទាន់ភ្ជាប់ MT5 Server — កំពុងរង់ចាំការតភ្ជាប់';
    return;
  }

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

  botState.selectedAsset = 'XAUUSD';
  const maxOpen = botState.riskConfig?.maxOpenTrades || 4;
  const currentOpenCount = (botState.openTrades || []).length;

  await checkActualMarketStatus();
  botState.isMarketOpen = isMarketOpen; 
  
  if (!isMarketOpen) {
    botState.statusMessageKhmer = \`⏸️ [MARKET CLOSED] \${marketStatusReason} — រំលងការវិភាគ (Skip Analysis)\`;
    return;
  }

  const isInside = checkInsideTradingHours();
  botState.isInsideTradingHours = isInside;
  if (!isInside) {
    botState.statusMessageKhmer = \`⏸️ [ICT EA] ក្រៅម៉ោងជួញដូរ — ផ្អាកបើក Trade ថ្មី\`;
    return;
  }

  if (currentOpenCount >= maxOpen) {
    botState.statusMessageKhmer = \`🟢 [ICT EA] គ្រប់គ្រង Trade សកម្ម (\${currentOpenCount}/\${maxOpen} Trades)\`;
    return;
  }

  const currentAsk = botState.askPrice || botState.goldPrice || 0;
  const currentBid = botState.bidPrice || botState.goldPrice || 0;

  if (currentAsk <= 0 || currentBid <= 0) return;

  const accountId = botState.account.metaApiAccountId;
  const token = botState.account.metaApiToken;
  const baseUrl = botState.account.metaApiUrl;
  const symbolToTrade = botState.activeGoldSymbol || (botState.account.accountType === 'cent' ? 'XAUUSDc' : 'XAUUSDm');

  if (!accountId || !token || !baseUrl) return;

  botState.statusMessageKhmer = \`⏳ [ICT EA] Analyzing Real Market...\`;
  
  const h4Candles = await fetchRealCandles(baseUrl, accountId, token, symbolToTrade, '4h', 30);
  const m15Candles = await fetchRealCandles(baseUrl, accountId, token, symbolToTrade, '15m', 150);
  const m1Candles = await fetchRealCandles(baseUrl, accountId, token, symbolToTrade, '1m', 100);
  
  if (h4Candles.length > 0 && m15Candles.length > 0 && m1Candles.length > 0) {
      
      // Update config settings dynamically if they change from UI
      ictEaEngine.config.lotSize = Number(botState.riskConfig?.lotSize || 0.01);
      ictEaEngine.config.dailyLossLimit = Number(botState.riskConfig?.maxDailyLossAmount || 50);
      ictEaEngine.config.maxConsecutiveSL = Number(botState.riskConfig?.maxConsecutiveLosses || 3);
      ictEaEngine.config.cooldownMinutes = Number(botState.riskConfig?.cooldownMinutes || 15);
      ictEaEngine.config.maxOpenTrades = Number(botState.riskConfig?.maxOpenTrades || 4);
      ictEaEngine.config.tradingSessionStart = botState.tradingHours?.startHour || "08:00";
      ictEaEngine.config.tradingSessionEnd = botState.tradingHours?.stopHour || "22:00";
      
      await ictMarketAdapter.processMarketData(
          currentAsk, currentBid, 
          h4Candles, m15Candles, m1Candles, 
          Date.now()
      );

      if (ictEaEngine.state.currentSetup) {
         const s = ictEaEngine.state.currentSetup;
         botState.statusMessageKhmer = \`🔍 [ICT EA SAFE-MODE] \${s.side} READY | SL: \${s.sl.toFixed(2)} | TP: \${s.tp.toFixed(2)}\`;
         botState.signals = { gold: s.side };
      } else {
         botState.statusMessageKhmer = \`🔍 [ICT EA SAFE-MODE] NO SETUP\`;
         botState.signals = { gold: 'WAIT' };
      }
  } else {
      botState.statusMessageKhmer = \`🔴 [ICT EA SAFE-MODE] MT5 Data Feed Error\`;
  }
}

`;
    code = code.substring(0, startIndex) + newFunction + code.substring(endIndex);
    fs.writeFileSync('server.ts', code);
    console.log("Replaced old EA completely with new ICT EA");
} else {
    console.log("Could not find markers");
}
