import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaPosition, DaRaSetup, DaRaUserSettings, DaRaBrokerInterface, DaRaTelegramInterface } from './src/engines/dara_m1/types';

async function runComprehensiveTrailingSuite() {
  console.log('================================================================');
  console.log('🧪 DARA M1 EA — FINAL TRAILING SL / PROFIT LOCK VERIFICATION SUITE');
  console.log('================================================================\n');

  let allPassed = true;
  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ PASS | ${testName}${details ? ` (${details})` : ''}`);
    } else {
      console.error(`❌ FAIL | ${testName}${details ? ` (${details})` : ''}`);
      allPassed = false;
    }
  }

  const trailing = new DaRaProfitTrailing();

  // ================================================================
  // TEST 1: BUY TRAILING ACTIVATION AT EXACT DISTANCE = 1.5 FROM TP
  // ================================================================
  console.log('\n--- 1. BUY TRAILING ACTIVATION TEST ---');
  const buySetup: DaRaSetup = {
    id: 'SETUP_BUY_001',
    direction: 'BUY',
    sweepLevel: 4400,
    sweepTime: 1000,
    displacementConfirmed: true,
    mssLevel: 4405,
    mssTime: 1010,
    lockedEntryPrice: 4405,
    virtualSLPrice: 4375,
    virtualTPPrice: 4420,
    sharedSL: 4375,
    sharedTP: 4420, // TP = 4420
    userSlDistance: 30,
    userTpDistance: 15,
    createdAt: 1000,
    status: 'EXECUTED',
    trailingState: { activated: false }
  };

  const buyPositions: DaRaPosition[] = [
    { ticket: 'B1', symbol: 'XAUUSD', type: 'BUY', lot: 0.01, openPrice: 4405, currentPrice: 4405, sl: 4375, tp: 4420, originalTp: 4420, openTime: 1000 },
    { ticket: 'B2', symbol: 'XAUUSD', type: 'BUY', lot: 0.01, openPrice: 4404, currentPrice: 4404, sl: 4375, tp: 4420, originalTp: 4420, openTime: 1005 },
    { ticket: 'B3', symbol: 'XAUUSD', type: 'BUY', lot: 0.01, openPrice: 4403, currentPrice: 4403, sl: 4375, tp: 4420, originalTp: 4420, openTime: 1010 },
    { ticket: 'B4', symbol: 'XAUUSD', type: 'BUY', lot: 0.01, openPrice: 4402, currentPrice: 4402, sl: 4375, tp: 4420, originalTp: 4420, openTime: 1015 },
    { ticket: 'B5', symbol: 'XAUUSD', type: 'BUY', lot: 0.01, openPrice: 4401, currentPrice: 4401, sl: 4375, tp: 4420, originalTp: 4420, openTime: 1020 }
  ];

  // 1a. Price before activation (e.g. 4418.0 < 4418.5) -> Trailing OFF
  const preRes = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4418.0, 4418.2);
  assert(!preRes.activatedThisTick && !buySetup.trailingState.activated, 'BUY Before Activation: Price 4418.0 < TP - 1.5 (4418.5) -> Trailing OFF');

  // 1b. Price reaches 4418.5 (TP - 1.5) -> Trailing Activates ONCE
  const actRes = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4418.5, 4418.7);
  assert(actRes.activatedThisTick === true, 'Activation distance = 1.5: BUY reaches 4418.5 -> Activated');
  assert(buySetup.trailingState.activated === true, '1 Setup = 1 shared Trailing State: activated flag set to true');
  assert(buySetup.trailingState.initialHiddenSL === 4418.5, 'Initial Hidden SL = TP - 1.5', `Expected 4418.5, Got ${buySetup.trailingState.initialHiddenSL}`);
  assert(buySetup.trailingState.currentHiddenSL === 4418.5, 'Current Hidden SL initialized to 4418.5');
  assert(buyPositions.every(p => p.trailingActivated === true), '5 Positions share the same Trailing State: all marked trailingActivated');

  // 1c. Activation can happen ONLY ONCE per Setup
  const repeatRes = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4418.6, 4418.8);
  assert(repeatRes.activatedThisTick === false, 'Trailing activates only once per Setup: repeat tick does not re-activate');

  // ================================================================
  // TEST 2: BUY CONTINUOUS TRAILING & MONOTONICITY (NEVER LOOSEN)
  // ================================================================
  console.log('\n--- 2. BUY CONTINUOUS TRAILING & MONOTONICITY TEST ---');
  // Price 4419.0 -> Proposed SL = 4419.0 - 1.5 = 4417.5 < 4418.5 (Previous) -> REJECT update
  const t4419 = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4419.0, 4419.2);
  assert(!t4419.shouldModifyBrokerSL && buySetup.trailingState.currentHiddenSL === 4418.5, 'Hidden SL never loosens: Price 4419.0 proposes 4417.5 -> Rejected, held at 4418.5');

  // Price 4420.0 -> Proposed SL = 4420.0 - 1.5 = 4418.5 == 4418.5 -> Held
  const t4420 = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4420.0, 4420.2);
  assert(buySetup.trailingState.currentHiddenSL === 4418.5, 'Price 4420.0 proposes 4418.5 -> Held at 4418.5');

  // Price 4421.0 -> Proposed SL = 4421.0 - 1.5 = 4419.5 > 4418.5 -> ADVANCE
  const t4421 = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4421.0, 4421.2);
  assert(t4421.shouldModifyBrokerSL && buySetup.trailingState.currentHiddenSL === 4419.5, 'Continuous Trailing: Price 4421.0 -> Hidden SL advanced to 4419.5');

  // Price 4422.0 -> Proposed SL = 4422.0 - 1.5 = 4420.5 > 4419.5 -> ADVANCE
  const t4422 = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4422.0, 4422.2);
  assert(t4422.shouldModifyBrokerSL && buySetup.trailingState.currentHiddenSL === 4420.5, 'Continuous Trailing: Price 4422.0 -> Hidden SL advanced to 4420.5');

  // Price 4423.0 -> Proposed SL = 4423.0 - 1.5 = 4421.5 > 4420.5 -> ADVANCE
  const t4423 = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4423.0, 4423.2);
  assert(t4423.shouldModifyBrokerSL && buySetup.trailingState.currentHiddenSL === 4421.5, 'Continuous Trailing: Price 4423.0 -> Hidden SL advanced to 4421.5');

  // Price drops back to 4422.0 -> Proposed SL = 4420.5 < 4421.5 -> MUST NOT LOOSEN
  const tDrop = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4422.0, 4422.2);
  assert(!tDrop.shouldModifyBrokerSL && buySetup.trailingState.currentHiddenSL === 4421.5, 'Hidden SL never loosens on pullback: Price drops to 4422.0 -> SL kept at 4421.5');

  // ================================================================
  // TEST 3: BUY BASKET CLOSE AT LAST HIDDEN SL
  // ================================================================
  console.log('\n--- 3. BUY BASKET CLOSE TEST ---');
  // Price reverses and hits 4421.5 -> Trigger Basket Close
  const tClose = trailing.evaluateSetupTrailing(buySetup, buyPositions, 4421.5, 4421.7);
  assert(tClose.shouldCloseBasket === true && tClose.closeReason === 'TRAILING_SL_HIT', 'Basket close: Price 4421.5 hits Hidden SL 4421.5 -> shouldCloseBasket: true');

  // ================================================================
  // TEST 4: SELL TRAILING SUITE (ACTIVATION, CONTINUOUS, MONOTONICITY, CLOSE)
  // ================================================================
  console.log('\n--- 4. SELL TRAILING TEST ---');
  const sellSetup: DaRaSetup = {
    id: 'SETUP_SELL_001',
    direction: 'SELL',
    sweepLevel: 4440,
    sweepTime: 2000,
    displacementConfirmed: true,
    mssLevel: 4435,
    mssTime: 2010,
    lockedEntryPrice: 4435,
    virtualSLPrice: 4465,
    virtualTPPrice: 4420,
    sharedSL: 4465,
    sharedTP: 4420, // TP = 4420
    userSlDistance: 30,
    userTpDistance: 15,
    createdAt: 2000,
    status: 'EXECUTED',
    trailingState: { activated: false }
  };

  const sellPositions: DaRaPosition[] = [
    { ticket: 'S1', symbol: 'XAUUSD', type: 'SELL', lot: 0.01, openPrice: 4435, currentPrice: 4435, sl: 4465, tp: 4420, originalTp: 4420, openTime: 2000 },
    { ticket: 'S2', symbol: 'XAUUSD', type: 'SELL', lot: 0.01, openPrice: 4436, currentPrice: 4436, sl: 4465, tp: 4420, originalTp: 4420, openTime: 2005 },
    { ticket: 'S3', symbol: 'XAUUSD', type: 'SELL', lot: 0.01, openPrice: 4437, currentPrice: 4437, sl: 4465, tp: 4420, originalTp: 4420, openTime: 2010 },
    { ticket: 'S4', symbol: 'XAUUSD', type: 'SELL', lot: 0.01, openPrice: 4438, currentPrice: 4438, sl: 4465, tp: 4420, originalTp: 4420, openTime: 2015 },
    { ticket: 'S5', symbol: 'XAUUSD', type: 'SELL', lot: 0.01, openPrice: 4439, currentPrice: 4439, sl: 4465, tp: 4420, originalTp: 4420, openTime: 2020 }
  ];

  // 4a. Price before activation (e.g. Ask = 4422.0 > TP + 1.5 (4421.5)) -> Trailing OFF
  const sellPre = trailing.evaluateSetupTrailing(sellSetup, sellPositions, 4421.8, 4422.0);
  assert(!sellPre.activatedThisTick && !sellSetup.trailingState.activated, 'SELL Before Activation: Ask 4422.0 > TP + 1.5 (4421.5) -> Trailing OFF');

  // 4b. Price reaches 4421.5 (TP + 1.5) -> Trailing Activates ONCE
  const sellAct = trailing.evaluateSetupTrailing(sellSetup, sellPositions, 4421.3, 4421.5);
  assert(sellAct.activatedThisTick === true, 'SELL Activation distance = 1.5: Ask reaches 4421.5 -> Activated');
  assert(sellSetup.trailingState.initialHiddenSL === 4421.5, 'SELL Initial Hidden SL = TP + 1.5 (4421.5)', `Got ${sellSetup.trailingState.initialHiddenSL}`);
  assert(sellPositions.every(p => p.trailingActivated === true), 'SELL 5 Positions share the same Trailing State');

  // 4c. Continuous Trailing downwards: Ask 4420.0 -> Proposed = 4421.5 (Equal, held)
  const s4420 = trailing.evaluateSetupTrailing(sellSetup, sellPositions, 4419.8, 4420.0);
  assert(sellSetup.trailingState.currentHiddenSL === 4421.5, 'SELL Price 4420.0 -> Held at 4421.5');

  // Ask 4419.0 -> Proposed = 4419.0 + 1.5 = 4420.5 < 4421.5 -> ADVANCE DOWN
  const s4419 = trailing.evaluateSetupTrailing(sellSetup, sellPositions, 4418.8, 4419.0);
  assert(s4419.shouldModifyBrokerSL && sellSetup.trailingState.currentHiddenSL === 4420.5, 'SELL Continuous Trailing: Ask 4419.0 -> Hidden SL advanced down to 4420.5');

  // Ask 4418.0 -> Proposed = 4418.0 + 1.5 = 4419.5 < 4420.5 -> ADVANCE DOWN
  const s4418 = trailing.evaluateSetupTrailing(sellSetup, sellPositions, 4417.8, 4418.0);
  assert(s4418.shouldModifyBrokerSL && sellSetup.trailingState.currentHiddenSL === 4419.5, 'SELL Continuous Trailing: Ask 4418.0 -> Hidden SL advanced down to 4419.5');

  // Bounce to 4419.0 -> Proposed = 4420.5 > 4419.5 -> MUST NOT LOOSEN
  const sBounce = trailing.evaluateSetupTrailing(sellSetup, sellPositions, 4418.8, 4419.0);
  assert(!sBounce.shouldModifyBrokerSL && sellSetup.trailingState.currentHiddenSL === 4419.5, 'SELL Hidden SL never loosens: Bounce to 4419.0 -> SL kept at 4419.5');

  // Price reverses up to hit 4419.5 -> Basket Close
  const sClose = trailing.evaluateSetupTrailing(sellSetup, sellPositions, 4419.3, 4419.5);
  assert(sClose.shouldCloseBasket === true && sClose.closeReason === 'TRAILING_SL_HIT', 'SELL Basket close: Ask 4419.5 hits Hidden SL 4419.5 -> shouldCloseBasket: true');

  // ================================================================
  // TEST 5: FULL ENGINE END-TO-END BASKET CLOSE, RESET & NO GHOST SETUP
  // ================================================================
  console.log('\n--- 5. FULL ENGINE END-TO-END BASKET CLOSE & RESET TEST ---');
  let brokerClosedTickets: string[] = [];
  let modifiedPositions: { ticket: string | number; sl: number; tp?: number }[] = [];
  let brokerPositions: DaRaPosition[] = [];

  const mockBroker: DaRaBrokerInterface = {
    async sendOrder(order) {
      return { success: true, ticket: `T_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` };
    },
    async modifyPosition(ticket, newSl, newTp) {
      modifiedPositions.push({ ticket, sl: newSl, tp: newTp });
      return { success: true };
    },
    async closePosition(ticket) {
      brokerClosedTickets.push(String(ticket));
      brokerPositions = brokerPositions.filter(p => String(p.ticket) !== String(ticket));
      return { success: true };
    },
    async getOpenPositions() {
      return brokerPositions;
    },
    async getSymbolInfo() {
      return { pointSize: 0.01 };
    }
  };

  const settings: DaRaUserSettings = {
    lotSize: 0.01,
    slDistance: 30,
    tpDistance: 15,
    dailyLossLimit: 50,
    maxOpenTrades: 5,
    maxConsecutiveSL: 3,
    cooldownMinutes: 15,
    maxSpreadPoints: 30,
    newsFilterEnabled: false,
    newsMinsBefore: 60,
    newsMinsAfter: 60,
    trailingEnabled: true,
    entryDistance: 2.0,
    trailingDistance: 1.5,
    liveTradingEnabled: false
  };

  const engine = new DaRaM1Engine(mockBroker, settings);
  engine.start();

  // Manually attach a 5-position BUY setup
  const eSetup: DaRaSetup = {
    id: 'SETUP_ENGINE_BASKET_1',
    direction: 'BUY',
    sweepLevel: 4400,
    sweepTime: 5000,
    displacementConfirmed: true,
    mssLevel: 4405,
    mssTime: 5010,
    lockedEntryPrice: 4405,
    virtualSLPrice: 4375,
    virtualTPPrice: 4420,
    sharedSL: 4375,
    sharedTP: 4420,
    userSlDistance: 30,
    userTpDistance: 15,
    createdAt: 5000,
    status: 'EXECUTED',
    trailingState: { activated: false }
  };

  const p1: DaRaPosition = {
    ticket: 'TK_1', symbol: 'XAUUSD', type: 'BUY', lot: 0.01, openPrice: 4405, currentPrice: 4405, sl: 4375, tp: 4420, originalTp: 4420, openTime: 5000
  };
  const p2: DaRaPosition = {
    ticket: 'TK_2', symbol: 'XAUUSD', type: 'BUY', lot: 0.01, openPrice: 4404, currentPrice: 4404, sl: 4375, tp: 4420, originalTp: 4420, openTime: 5005
  };
  const p3: DaRaPosition = {
    ticket: 'TK_3', symbol: 'XAUUSD', type: 'BUY', lot: 0.01, openPrice: 4403, currentPrice: 4403, sl: 4375, tp: 4420, originalTp: 4420, openTime: 5010
  };
  brokerPositions = [p1, p2, p3];

  (engine as any).stateMachine.onSetupDetected(eSetup);
  (engine as any).stateMachine.onPositionOpened(p1, 0);
  (engine as any).stateMachine.onPositionOpened(p2, 1);
  (engine as any).stateMachine.onPositionOpened(p3, 2);

  // Tick 1: Price 4415 -> Still below 4418.5 -> Trailing inactive
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 4415, ask: 4415.2, spreadPoints: 2, openTradesCount: 3, time: 6000 });
  assert((engine as any).stateMachine.getSetup()?.trailingState?.activated === false, 'Engine Tick 1: Trailing not activated before 4418.5');

  // Tick 2: Price reaches 4418.5 (TP - 1.5) -> Trailing Activates
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 4418.5, ask: 4418.7, spreadPoints: 2, openTradesCount: 3, time: 6001 });
  assert((engine as any).stateMachine.getSetup()?.trailingState?.activated === true, 'Engine Tick 2: Trailing activated at 4418.5');
  assert((engine as any).stateMachine.getSetup()?.trailingState?.currentHiddenSL === 4418.5, 'Engine Tick 2: Hidden SL initialized to 4418.5');

  // Tick 3: Price moves up to 4422.0 -> Hidden SL advances to 4420.5
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 4422.0, ask: 4422.2, spreadPoints: 2, openTradesCount: 3, time: 6002 });
  assert((engine as any).stateMachine.getSetup()?.trailingState?.currentHiddenSL === 4420.5, 'Engine Tick 3: Hidden SL advanced to 4420.5 (4422.0 - 1.5)');

  // Tick 4: Price drops and hits 4420.5 -> Entire Basket Closed
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 4420.5, ask: 4420.7, spreadPoints: 2, openTradesCount: 3, time: 6003 });

  assert((engine as any).stateMachine.hasOpenPositions() === false, 'Basket close: All active positions cleared from State Machine');
  assert((engine as any).stateMachine.getSetup() === null, 'Reset: Current Setup cleared to null');
  assert((engine as any).stateMachine.getState() === 'SCANNING', 'Reset -> M1 MARKET SCAN: State returned to SCANNING');
  assert((engine as any).strategy.getScanBaselineTime() >= 6003, 'No Ghost/Stale Setup regression: Scan baseline time reset to close time (>= 6003)');

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL 15 REQUIRED TESTS PASSED 100%');
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('================================================================');
}

runComprehensiveTrailingSuite().catch(e => {
  console.error('Error running test suite:', e);
  process.exit(1);
});
