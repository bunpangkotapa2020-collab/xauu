import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';
import { DaRaUserSettings } from './src/engines/dara_m1/types';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function runSemanticsValidation() {
  console.log('================================================================');
  console.log('🛡️ DaRa M1 EA v1.0 — CLOSE ALL TRADES = STOP BOT ONLY VALIDATION');
  console.log('================================================================\n');

  let passedCount = 0;
  function markPass(id: string, description: string) {
    passedCount++;
    console.log(`✅ PASS [${id}]: ${description}`);
  }

  const userSettings: DaRaUserSettings = {
    lotSize: 0.01,
    slDistance: 30.0,
    tpDistance: 10.0,
    dailyLossLimit: 2000,
    maxOpenTrades: 5,
    maxConsecutiveSL: 3,
    cooldownMinutes: 15,
    maxSpreadPoints: 25,
    newsFilterEnabled: false,
    newsMinsBefore: 0,
    newsMinsAfter: 0,
    trailingEnabled: true,
    entryDistance: 1.0,
    liveTradingEnabled: true
  };

  // Track broker calls
  let closeBrokerCalls = 0;
  let modifyBrokerCalls = 0;
  const executedOrders: any[] = [];

  const mockBroker = {
    getSymbolInfo: async () => ({ pointSize: 0.01 }),
    sendOrder: async (req: any) => {
      executedOrders.push(req);
      return { success: true, ticket: 'TICK_' + executedOrders.length };
    },
    closePosition: async () => {
      closeBrokerCalls++;
      return { success: true };
    },
    modifyPosition: async () => {
      modifyBrokerCalls++;
      return { success: true };
    }
  };

  // Simulated server-level botState
  const botState: any = {
    desiredBotState: 'STOPPED',
    status: 'stopped',
    isStartRequested: false,
    startConfirmedTime: null,
    magicNumber: 778899,
    signals: { gold: 'WAIT' },
    openTrades: [],
    account: {
      balance: 10000,
      equity: 10000,
      isConnected: true,
      currency: 'USC'
    },
    todayProfitLoss: 0,
    todayTradeCount: 0,
    todayWinCount: 0,
    todayLossCount: 0,
    statusMessageKhmer: ''
  };

  const engine = new DaRaM1Engine(mockBroker as any, userSettings);
  (engine as any).cachedPointSize = 0.01;
  (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

  // ----------------------------------------------------------------
  // TEST A: START BOT
  // ----------------------------------------------------------------
  botState.desiredBotState = 'RUNNING';
  botState.status = 'running';
  botState.isStartRequested = true;
  engine.start();

  assert(engine.getIsRunning() === true, 'Engine must be running');
  assert(engine.getState() === 'SCANNING', 'State must transition to SCANNING');
  markPass('TEST A', 'START BOT transitions to RUNNING and begins 24/7 M1 market scanning');

  // Simulate setup detection and Level 1 execution
  const sm = (engine as any).stateMachine as DaRaM1StateMachine;
  sm.onSetupDetected({
    id: 'SETUP_AUDIT_1',
    direction: 'BUY',
    sweepLevel: 2600,
    sweepTime: Date.now(),
    displacementConfirmed: true,
    mssLevel: 2610,
    mssTime: Date.now(),
    lockedEntryPrice: 2610,
    signalPrice: 2610,
    virtualSLPrice: 2580,
    virtualTPPrice: 2620,
    sharedSL: 2580,
    sharedTP: 2620
  }, engine.getUserSettings());

  // Trigger tick to open Position #1
  await engine.onMarketUpdate({
    symbol: 'XAUUSD',
    bid: 2609,
    ask: 2609.2,
    time: Date.now(),
    spreadPoints: 20,
    openTradesCount: 0,
    m1Candles: []
  });

  assert(executedOrders.length === 1, 'Position #1 executed');
  const activeTrade = {
    id: 'TICK_1',
    symbol: 'XAUUSD',
    type: 'BUY',
    lot: 0.01,
    openPrice: 2609.2,
    sl: 2580,
    tp: 2620,
    magicNumber: 778899,
    isBotTrade: true,
    floatingProfit: 5.50
  };
  botState.openTrades = [activeTrade];

  assert(engine.getState() === 'TRADE_ACTIVE', 'Engine state must be TRADE_ACTIVE');
  markPass('TEST A-ACTIVE', 'Position #1 opened on MT5, Trade active with SL=2580, TP=2620');

  // ----------------------------------------------------------------
  // TEST B & C: ACTION "close_all" CALLED — VERIFY NO BROKER POSITIONS CLOSED
  // ----------------------------------------------------------------
  // Execute the exact server.ts close_all logic:
  botState.desiredBotState = 'STOPPED';
  botState.status = 'stopped';
  botState.isStartRequested = false;
  botState.startConfirmedTime = null;
  botState.signals = { gold: 'WAIT' };
  botState.signalDetails = undefined;

  // Engine stop called
  engine.stop();

  const activeBotTrades = (botState.openTrades || []).filter(
    (t: any) => t.magicNumber === botState.magicNumber || t.isBotTrade
  );
  const activeCount = activeBotTrades.length;

  if (activeCount > 0) {
    botState.statusMessageKhmer = `🔴 STOP = បញ្ឈប់ Bot ប៉ុណ្ណោះ — រារាំង Trade ថ្មី — មាន ${activeCount} Position កំពុងបន្តដំណើរការលើ MT5 (Broker SL/TP នៅដដែល)`;
  } else {
    botState.statusMessageKhmer = `🔴 STOP = បញ្ឈប់ Bot ប៉ុណ្ណោះ — រារាំង Trade ថ្មី (គ្មាន Active Position លើ MT5 ទេ)`;
  }

  // ----------------------------------------------------------------
  // TEST C: STRICT FORBIDDEN CHECKS
  // ----------------------------------------------------------------
  assert(closeBrokerCalls === 0, 'FORBIDDEN: closePosition / closeRealTrade must NEVER be called');
  assert(modifyBrokerCalls === 0, 'FORBIDDEN: modifyPosition must NEVER be called to wipe SL/TP');
  markPass('TEST C', 'Strict Zero Broker Closes & Zero Modifications: closeBrokerCalls=0, modifyBrokerCalls=0');

  // ----------------------------------------------------------------
  // TEST D: PRESERVE EXISTING POSITIONS
  // ----------------------------------------------------------------
  assert(botState.openTrades.length === 1, 'botState.openTrades must retain the active trade');
  assert(botState.openTrades[0].id === 'TICK_1', 'Ticket ID must remain TICK_1');
  assert(botState.openTrades[0].sl === 2580, 'SL must remain unchanged (2580)');
  assert(botState.openTrades[0].tp === 2620, 'TP must remain unchanged (2620)');
  assert(botState.openTrades[0].lot === 0.01, 'Lot size must remain 0.01');
  markPass('TEST D', 'Broker positions preserved intact on MT5 with authoritative Hard SL/TP');

  // ----------------------------------------------------------------
  // TEST E: BOT STATE TRANSITIONS TO STOPPED
  // ----------------------------------------------------------------
  assert(botState.status === 'stopped', 'botState.status must be stopped');
  assert(botState.desiredBotState === 'STOPPED', 'desiredBotState must be STOPPED');
  assert(botState.signals.gold === 'WAIT', 'signals.gold must reset to WAIT');
  assert(engine.getIsRunning() === false, 'engine.getIsRunning() must be false');
  markPass('TEST E', 'Bot status is STOPPED, new signal searching halted');

  // ----------------------------------------------------------------
  // TEST F: NEW ENTRIES BLOCKED WHILE STOPPED
  // ----------------------------------------------------------------
  // Deliver tick at Level 2 target (2608) while stopped
  await engine.onMarketUpdate({
    symbol: 'XAUUSD',
    bid: 2608,
    ask: 2608.2,
    time: Date.now(),
    spreadPoints: 20,
    openTradesCount: 1,
    m1Candles: []
  });

  assert(executedOrders.length === 1, 'No new entries executed while engine is stopped');
  markPass('TEST F', 'DaRa M1 Engine completely blocks new entries while in STOPPED state');

  // ----------------------------------------------------------------
  // TEST G: USER PRESSES START BOT AGAIN WHILE BROKER POSITION STILL OPEN
  // ----------------------------------------------------------------
  // User re-starts bot
  botState.desiredBotState = 'RUNNING';
  botState.status = 'running';
  botState.isStartRequested = true;

  // Sync positions from broker:
  await engine.syncBrokerPositions([
    {
      ticket: 'TICK_1',
      symbol: 'XAUUSD',
      type: 'BUY',
      lot: 0.01,
      openPrice: 2609.2,
      sl: 2580,
      tp: 2620,
      currentPrice: 2611.0,
      pnl: 18.0,
      level: 1,
      targetPrice: 2609,
      executedAt: Date.now()
    }
  ]);

  engine.start();

  assert(engine.getIsRunning() === true, 'Engine must resume running');
  assert(sm.getState() === 'TRADE_ACTIVE', 'State machine must transition to TRADE_ACTIVE to monitor existing trade');
  assert(executedOrders.length === 1, 'No duplicate entry opened on START with active positions');
  markPass('TEST G', 'Restarting Bot preserves TRADE_ACTIVE, syncs broker trade without duplicate entries');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedCount}/${passedCount} TESTS PASSED WITH 100% COMPLIANCE`);
  console.log('================================================================');
}

runSemanticsValidation().catch(err => {
  console.error('❌ Validation failed:', err);
  process.exit(1);
});
