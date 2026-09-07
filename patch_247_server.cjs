const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

// 1. Update checkInsideTradingHours to 24/7 AUTO
const oldCheckHours = `function checkInsideTradingHours(): boolean {
  if (!botState.tradingHours.enabled) return true;
  
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Phnom_Penh', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  const h = parts.find(p => p.type === 'hour')?.value;
  const min = parts.find(p => p.type === 'minute')?.value;
  
  const currentDate = \`\${y}-\${m}-\${d}\`;
  const currentTime = \`\${h}:\${min}\`;
  const currentDateTime = \`\${currentDate}T\${currentTime}\`;

  const th = botState.tradingHours;
  const startH = th.startHour || '08:00';
  const stopH = th.stopHour || '22:00';
  const startD = th.startDate;
  const endD = th.endDate;
  const mode = th.mode || (startD || endD ? 'custom_date' : 'daily');

  // If in custom date mode
  if (mode === 'custom_date' && (startD || endD)) {
    const fullStart = \`\${startD || currentDate}T\${startH}\`;
    const fullEnd = \`\${endD || startD || currentDate}T\${stopH}\`;
    return currentDateTime >= fullStart && currentDateTime <= fullEnd;
  }

  // Daily recurring mode
  if (startH <= stopH) {
    return currentTime >= startH && currentTime < stopH;
  } else {
    // Overnight trading window (e.g. 20:00 to 04:00)
    return currentTime >= startH || currentTime < stopH;
  }
}`;

const newCheckHours = `function checkInsideTradingHours(): boolean {
  // 🟢 24/7 AUTO: EA operates 24/7 continuously whenever the broker market is open
  return true;
}`;

if (serverCode.includes(oldCheckHours)) {
  serverCode = serverCode.replace(oldCheckHours, newCheckHours);
  console.log('Replaced checkInsideTradingHours with 24/7 version');
} else {
  console.log('Notice: checkInsideTradingHours string not matched directly, applying regex replace');
  serverCode = serverCode.replace(/function checkInsideTradingHours\(\): boolean \{[\s\S]*?\n\}/, newCheckHours);
}

// 2. Update executeAIAnalysis market awareness and live trading gating
const oldExecuteTarget = `    calculateVolatilityAndSpeed();
    lastAnalysisTimestamp = Date.now();
    const isRunning = botState.status === 'running';
    
    // Safety & Session Gates
    const isInside = checkInsideTradingHours();
    botState.isInsideTradingHours = isInside;
    
    // LIVE_TRADING_ENABLED is only true if bot is running AND inside trading hours AND no limits hit
    const isSafeToTrade = isRunning && isInside && !botState.dailyLossLimitHit;
    ictEaEngine.LIVE_TRADING_ENABLED = isSafeToTrade;

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
      ictEaEngine.LIVE_TRADING_ENABLED = false;
      return;
    }

    if (!isInside && isRunning) {
      botState.statusMessageKhmer = \`⏸️ [ICT EA] ក្រៅម៉ោងជួញដូរ — ផ្អាកបើក Trade ថ្មី\`;
      return;
    }`;

const newExecuteCode = `    calculateVolatilityAndSpeed();
    lastAnalysisTimestamp = Date.now();
    const isRunning = botState.status === 'running';
    
    // 24/7 Session Gate - Always True
    botState.isInsideTradingHours = true;

    if (!botState.account.isConnected || !botState.account.serverConnected) {
      if (isRunning) {
        botState.statusMessageKhmer = '🔴 [ICT EA] មិនទាន់ភ្ជាប់ MT5 Server — កំពុងរង់ចាំការតភ្ជាប់';
      }
      ictEaEngine.LIVE_TRADING_ENABLED = false;
      return;
    }

    // Market Open / Closed Guard
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

    // When market is OPEN and bot is running without safety breaches
    const isSafeToTrade = isRunning && isMarketOpen && !botState.dailyLossLimitHit;
    ictEaEngine.LIVE_TRADING_ENABLED = isSafeToTrade;

    botState.selectedAsset = 'XAUUSD';
    const maxOpen = botState.riskConfig?.maxOpenTrades || 4;
    const currentOpenCount = (botState.openTrades || []).length;`;

if (serverCode.includes(oldExecuteTarget)) {
  serverCode = serverCode.replace(oldExecuteTarget, newExecuteCode);
  console.log('Replaced executeAIAnalysis logic with 24/7 market aware version');
} else {
  console.log('Could not directly match oldExecuteTarget, searching partial');
}

// 3. Update /api/bot/state to include isMarketOpen, marketStatusText, and 24/7 session
const oldStateTarget = `    res.json({
      ...botState,
      autoRiskProfile,
      startConfirmation,
      serverTime: serverTimeStr,
      isInsideTradingHours: isInsideHours,
      lastSavedAt: botState.lastSavedAt || new Date().toISOString(),
      isAutoSaved: true,
      liveEaConfig: {
        ...ictEaEngine.config,
        LIVE_TRADING_ENABLED: ictEaEngine.LIVE_TRADING_ENABLED
      }
    });`;

const newStateTarget = `    res.json({
      ...botState,
      isMarketOpen,
      marketStatusReason,
      marketStatusText: isMarketOpen ? '🟢 MARKET OPEN / EA ACTIVE' : '⏸️ WAITING FOR MARKET OPEN',
      autoRiskProfile,
      startConfirmation,
      serverTime: serverTimeStr,
      isInsideTradingHours: true,
      lastSavedAt: botState.lastSavedAt || new Date().toISOString(),
      isAutoSaved: true,
      liveEaConfig: {
        ...ictEaEngine.config,
        tradingSession: '24/7 AUTO',
        marketStatus: isMarketOpen ? '🟢 MARKET OPEN / EA ACTIVE' : '⏸️ WAITING FOR MARKET OPEN',
        LIVE_TRADING_ENABLED: ictEaEngine.LIVE_TRADING_ENABLED
      }
    });`;

if (serverCode.includes(oldStateTarget)) {
  serverCode = serverCode.replace(oldStateTarget, newStateTarget);
  console.log('Replaced /api/bot/state response with market status and 24/7 session');
}

// 4. Update action === 'start' message
const oldStartMsg = `botState.statusMessageKhmer = \`🔍 [AI Analysis 1 នាទី] ចាប់ផ្តើមវិភាគ [\${curAssetLabel}] — រង់ចាំរក Signal ត្រឹមត្រូវ (\${volume} Lot)\`;`;
const newStartMsg = `botState.statusMessageKhmer = \`🟢 EA RUNNING (24/7 AUTO) — កំពុងវិភាគ [\${curAssetLabel}] (\${volume} Lot) — ដំណើរការស្វ័យប្រវត្តិ\`;`;

if (serverCode.includes(oldStartMsg)) {
  serverCode = serverCode.replace(oldStartMsg, newStartMsg);
  console.log('Updated START statusMessageKhmer');
}

// 5. Update action === 'close_all' message
const oldCloseAllMsg1 = `botState.statusMessageKhmer = \`🛑 [ALL BOT TRADES CLOSED] បានបិទ \${closedCount} Positions របស់ Bot (Magic: \${botState.magicNumber}) លើ MT5 រួចរាល់ — 🚫 បញ្ឈប់ការបើក Trade ថ្មី (Blocked New Entries) — សូមចុច START BOT ដើម្បី Trade ម្តងទៀត\`;`;
const newCloseAllMsg1 = `botState.statusMessageKhmer = \`🔴 ALL TRADES CLOSED — បានបិទ \${closedCount} Positions របស់ Bot លើ MT5 រួចរាល់ — ផ្អាកបើក Trade ថ្មីរហូតដល់ចុច START ឡើងវិញ\`;`;

const oldCloseAllMsg2 = `botState.statusMessageKhmer = \`🛑 [ALL BOT TRADES CLOSED] គ្មាន Position របស់ Bot (Magic: \${botState.magicNumber}) លើ MT5 ទេ — 🚫 បញ្ឈប់ការបើក Trade ថ្មី (Blocked New Entries) — សូមចុច START BOT ដើម្បី Trade ម្តងទៀត\`;`;
const newCloseAllMsg2 = `botState.statusMessageKhmer = \`🔴 ALL TRADES CLOSED — គ្មាន Position របស់ Bot នៅសល់ទេ — ផ្អាកបើក Trade ថ្មីរហូតដល់ចុច START ឡើងវិញ\`;`;

if (serverCode.includes(oldCloseAllMsg1)) {
  serverCode = serverCode.replace(oldCloseAllMsg1, newCloseAllMsg1);
}
if (serverCode.includes(oldCloseAllMsg2)) {
  serverCode = serverCode.replace(oldCloseAllMsg2, newCloseAllMsg2);
}

fs.writeFileSync('server.ts', serverCode);
console.log('Saved server.ts');
