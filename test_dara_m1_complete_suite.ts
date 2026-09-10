import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';
import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaOrderExecution } from './src/engines/dara_m1/DaRaOrderExecution';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPLETE DaRa M1 EA v1.0 TEST SUITE');
  console.log('====================================================');

  const baseSettings = {
    lotSize: 0.02,
    slDistance: 30,
    tpDistance: 8,
    dailyLossLimit: 2000,
    maxOpenTrades: 5,
    maxConsecutiveSL: 6,
    cooldownMinutes: 20,
    maxSpreadPoints: 27,
    newsFilterEnabled: false,
    newsMinsBefore: 0,
    newsMinsAfter: 0,
    trailingEnabled: true,
    entryDistance: 2.0,
    liveTradingEnabled: false,
  };

  // ----------------------------------------------------
  // Test 1: 5-level BUY
  // ----------------------------------------------------
  try {
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_BUY_' + executedOrders.length };
      }
    };
    const engine = new DaRaM1Engine(mockBroker as any, { ...baseSettings, liveTradingEnabled: true });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    const locked = 2000;
    sm.onSetupDetected({
      id: 'setup_buy_1', direction: 'BUY', sweepLevel: 1990, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 2005, mssTime: Date.now(),
      lockedEntryPrice: locked, signalPrice: locked,
      virtualSLPrice: locked - 30, virtualTPPrice: locked + 8,
      sharedSL: locked - 30, sharedTP: locked + 8
    }, engine.getUserSettings());

    const setup = sm.getSetup();
    assert(setup?.entryLevels?.length === 5, 'BUY must generate exactly 5 entry levels');
    assert(setup?.entryLevels?.[0].targetPrice === 1998, 'BUY L1 = locked - 1*dist = 1998');
    assert(setup?.entryLevels?.[1].targetPrice === 1996, 'BUY L2 = locked - 2*dist = 1996');
    assert(setup?.entryLevels?.[2].targetPrice === 1994, 'BUY L3 = locked - 3*dist = 1994');
    assert(setup?.entryLevels?.[3].targetPrice === 1992, 'BUY L4 = locked - 4*dist = 1992');
    assert(setup?.entryLevels?.[4].targetPrice === 1990, 'BUY L5 = locked - 5*dist = 1990');

    results.push({ name: '1. 5-level BUY structure', passed: true, details: 'L1: 1998, L2: 1996, L3: 1994, L4: 1992, L5: 1990' });
  } catch (err: any) {
    results.push({ name: '1. 5-level BUY structure', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 2: 5-level SELL
  // ----------------------------------------------------
  try {
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_SELL_' + executedOrders.length };
      }
    };
    const engine = new DaRaM1Engine(mockBroker as any, { ...baseSettings, liveTradingEnabled: true });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    const locked = 2000;
    sm.onSetupDetected({
      id: 'setup_sell_1', direction: 'SELL', sweepLevel: 2010, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 1995, mssTime: Date.now(),
      lockedEntryPrice: locked, signalPrice: locked,
      virtualSLPrice: locked + 30, virtualTPPrice: locked - 8,
      sharedSL: locked + 30, sharedTP: locked - 8
    }, engine.getUserSettings());

    const setup = sm.getSetup();
    assert(setup?.entryLevels?.length === 5, 'SELL must generate exactly 5 entry levels');
    assert(setup?.entryLevels?.[0].targetPrice === 2002, 'SELL L1 = locked + 1*dist = 2002');
    assert(setup?.entryLevels?.[1].targetPrice === 2004, 'SELL L2 = locked + 2*dist = 2004');
    assert(setup?.entryLevels?.[2].targetPrice === 2006, 'SELL L3 = locked + 3*dist = 2006');
    assert(setup?.entryLevels?.[3].targetPrice === 2008, 'SELL L4 = locked + 4*dist = 2008');
    assert(setup?.entryLevels?.[4].targetPrice === 2010, 'SELL L5 = locked + 5*dist = 2010');

    results.push({ name: '2. 5-level SELL structure', passed: true, details: 'L1: 2002, L2: 2004, L3: 2006, L4: 2008, L5: 2010' });
  } catch (err: any) {
    results.push({ name: '2. 5-level SELL structure', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 3: Sequential Execution Level 1 -> 5
  // ----------------------------------------------------
  try {
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_' + executedOrders.length };
      }
    };
    const engine = new DaRaM1Engine(mockBroker as any, { ...baseSettings, liveTradingEnabled: true });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_seq', direction: 'BUY', sweepLevel: 1990, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 2005, mssTime: Date.now(),
      lockedEntryPrice: 2000, signalPrice: 2000,
      virtualSLPrice: 1970, virtualTPPrice: 2008,
      sharedSL: 1970, sharedTP: 2008
    }, engine.getUserSettings());

    // Trigger L1 (1998)
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 2000, high: 2000, low: 1998, close: 1998 }], openTradesCount: 0
    });
    assert(executedOrders.length === 1, 'Only L1 should execute first');

    // Trigger L2 (1996)
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1996, ask: 1996, spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1996, close: 1996 }], openTradesCount: 1
    });
    assert(executedOrders.length === 2, 'L2 should execute second');

    // Trigger L3, L4, L5
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1994, ask: 1994, spreadPoints: 5,
      m1Candles: [{ open: 1996, high: 1996, low: 1994, close: 1994 }], openTradesCount: 2
    });
    assert(executedOrders.length === 3, 'L3 should execute third');

    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1992, ask: 1992, spreadPoints: 5,
      m1Candles: [{ open: 1994, high: 1994, low: 1992, close: 1992 }], openTradesCount: 3
    });
    assert(executedOrders.length === 4, 'L4 should execute fourth');

    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1990, ask: 1990, spreadPoints: 5,
      m1Candles: [{ open: 1992, high: 1992, low: 1990, close: 1990 }], openTradesCount: 4
    });
    assert(executedOrders.length === 5, 'L5 should execute fifth');

    results.push({ name: '3. Sequential Level 1->5 execution', passed: true, details: 'Executed strictly in sequence 1->2->3->4->5' });
  } catch (err: any) {
    results.push({ name: '3. Sequential Level 1->5 execution', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 4: No Level 6
  // ----------------------------------------------------
  try {
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_' + executedOrders.length };
      }
    };
    const engine = new DaRaM1Engine(mockBroker as any, { ...baseSettings, liveTradingEnabled: true });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_no_l6', direction: 'BUY', sweepLevel: 1990, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 2005, mssTime: Date.now(),
      lockedEntryPrice: 2000, signalPrice: 2000,
      virtualSLPrice: 1970, virtualTPPrice: 2008,
      sharedSL: 1970, sharedTP: 2008
    }, engine.getUserSettings());

    // Execute all 5
    for (let i = 0; i < 5; i++) {
      const price = 1998 - i * 2;
      await engine.onMarketUpdate({
        symbol: 'XAUUSD', bid: price, ask: price, spreadPoints: 5,
        m1Candles: [{ open: 2000, high: 2000, low: price, close: price }], openTradesCount: i
      });
    }
    assert(executedOrders.length === 5, 'Exactly 5 orders executed');

    // Send price even lower (1985)
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1985, ask: 1985, spreadPoints: 5,
      m1Candles: [{ open: 1990, high: 1990, low: 1985, close: 1985 }], openTradesCount: 5
    });
    assert(executedOrders.length === 5, 'No Level 6 executed. Total remains 5');
    assert(sm.getNextPendingLevel() === null, 'getNextPendingLevel returns null when all 5 executed');

    results.push({ name: '4. Maximum 5 entries / No Level 6', passed: true, details: 'Hard cap at 5 verified' });
  } catch (err: any) {
    results.push({ name: '4. Maximum 5 entries / No Level 6', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 5: Shared SL/TP
  // ----------------------------------------------------
  try {
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_' + executedOrders.length };
      }
    };
    const engine = new DaRaM1Engine(mockBroker as any, { ...baseSettings, liveTradingEnabled: true, slDistance: 25, tpDistance: 10 });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    const locked = 2500;
    sm.onSetupDetected({
      id: 'setup_shared_sltp', direction: 'BUY', sweepLevel: 2490, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 2505, mssTime: Date.now(),
      lockedEntryPrice: locked, signalPrice: locked,
      virtualSLPrice: locked - 25, virtualTPPrice: locked + 10,
      sharedSL: locked - 25, sharedTP: locked + 10
    }, engine.getUserSettings());

    // Execute L1 (2498) and L2 (2496)
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 2498, ask: 2498, spreadPoints: 5,
      m1Candles: [{ open: 2500, high: 2500, low: 2498, close: 2498 }], openTradesCount: 0
    });
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 2496, ask: 2496, spreadPoints: 5,
      m1Candles: [{ open: 2498, high: 2498, low: 2496, close: 2496 }], openTradesCount: 1
    });

    assert(executedOrders.length === 2, '2 orders executed');
    const order1 = executedOrders[0];
    const order2 = executedOrders[1];

    assert(order1.sl === 2475, `Order 1 SL must be 2475, got ${order1.sl}`);
    assert(order1.tp === 2510, `Order 1 TP must be 2510, got ${order1.tp}`);
    assert(order2.sl === 2475, `Order 2 SL must be IDENTICAL shared 2475, got ${order2.sl}`);
    assert(order2.tp === 2510, `Order 2 TP must be IDENTICAL shared 2510, got ${order2.tp}`);

    results.push({ name: '5. Shared SL/TP across all entries', passed: true, details: `Order 1 & 2 SL: ${order1.sl}, TP: ${order1.tp}` });
  } catch (err: any) {
    results.push({ name: '5. Shared SL/TP across all entries', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 6: Safety Guards
  // ----------------------------------------------------
  try {
    const engine = new DaRaM1Engine({} as any, baseSettings);
    engine.start();

    // Spread test
    const spreadCheck = engine.evaluateSafety(35, 0); // max 27
    assert(!spreadCheck.isSafeToTrade, 'High spread must be blocked');
    assert(spreadCheck.isSpreadTooHigh === true, 'isSpreadTooHigh flag must be set');

    // Daily loss test
    engine.recordRealTradeResult(-2500); // limit 2000
    const lossCheck = engine.evaluateSafety(10, 0);
    assert(!lossCheck.isSafeToTrade, 'Daily loss limit must block trades');
    assert(lossCheck.isDailyLossHit === true, 'isDailyLossHit flag must be set');

    // Reset and verify clean
    engine.resetDailyLoss();
    const cleanCheck = engine.evaluateSafety(10, 0);
    assert(cleanCheck.isSafeToTrade, 'Clean state must pass safety');

    results.push({ name: '6. Safety Guards enforcement', passed: true, details: 'Spread guard and daily loss guard verified' });
  } catch (err: any) {
    results.push({ name: '6. Safety Guards enforcement', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 7: LIVE OFF Hard Block
  // ----------------------------------------------------
  try {
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_LIVE_' + executedOrders.length };
      }
    };
    // Engine starts with liveTradingEnabled = false
    const engine = new DaRaM1Engine(mockBroker as any, { ...baseSettings, liveTradingEnabled: false });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_live_off', direction: 'BUY', sweepLevel: 1990, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 2005, mssTime: Date.now(),
      lockedEntryPrice: 2000, signalPrice: 2000,
      virtualSLPrice: 1970, virtualTPPrice: 2008,
      sharedSL: 1970, sharedTP: 2008
    }, engine.getUserSettings());

    // Hit entry price while LIVE is OFF
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 2000, high: 2000, low: 1998, close: 1998 }], openTradesCount: 0
    });

    assert(executedOrders.length === 0, 'No order should be placed when LIVE is OFF');

    results.push({ name: '7. LIVE OFF hard block', passed: true, details: 'Execution blocked when liveTradingEnabled=false' });
  } catch (err: any) {
    results.push({ name: '7. LIVE OFF hard block', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 8: LIVE ON functional state synchronization
  // ----------------------------------------------------
  try {
    const engine = new DaRaM1Engine({} as any, { ...baseSettings, liveTradingEnabled: false });
    assert(engine.getUserSettings().liveTradingEnabled === false, 'Initial state must be false');

    engine.updateUserSettings({ liveTradingEnabled: true });
    assert(engine.getUserSettings().liveTradingEnabled === true, 'Updated state must be true');

    results.push({ name: '8. LIVE ON state synchronization', passed: true, details: 'updateUserSettings syncs liveTradingEnabled=true' });
  } catch (err: any) {
    results.push({ name: '8. LIVE ON state synchronization', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 9: LIVE OFF after ON
  // ----------------------------------------------------
  try {
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_' + executedOrders.length };
      }
    };
    const engine = new DaRaM1Engine(mockBroker as any, { ...baseSettings, liveTradingEnabled: true });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    // Turn LIVE OFF
    engine.updateUserSettings({ liveTradingEnabled: false });
    assert(engine.getUserSettings().liveTradingEnabled === false, 'State must be false after turning off');

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_off_after_on', direction: 'BUY', sweepLevel: 1990, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 2005, mssTime: Date.now(),
      lockedEntryPrice: 2000, signalPrice: 2000,
      virtualSLPrice: 1970, virtualTPPrice: 2008,
      sharedSL: 1970, sharedTP: 2008
    }, engine.getUserSettings());

    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 2000, high: 2000, low: 1998, close: 1998 }], openTradesCount: 0
    });
    assert(executedOrders.length === 0, 'Orders immediately blocked after turning off');

    results.push({ name: '9. LIVE OFF after ON', passed: true, details: 'Turning OFF immediately blocks subsequent entries' });
  } catch (err: any) {
    results.push({ name: '9. LIVE OFF after ON', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 10: Engine Stopped Block
  // ----------------------------------------------------
  try {
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_' + executedOrders.length };
      }
    };
    const engine = new DaRaM1Engine(mockBroker as any, { ...baseSettings, liveTradingEnabled: true });
    // Note: engine is NOT started (stopped)
    assert(engine.getIsRunning() === false, 'Engine is stopped');

    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 2000, high: 2000, low: 1998, close: 1998 }], openTradesCount: 0
    });
    assert(executedOrders.length === 0, 'Stopped engine must ignore market updates');

    results.push({ name: '10. Engine Stopped Block', passed: true, details: 'onMarketUpdate returns early if engine not running' });
  } catch (err: any) {
    results.push({ name: '10. Engine Stopped Block', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 11: MT5 Disconnected Block
  // ----------------------------------------------------
  try {
    const engine = new DaRaM1Engine({} as any, baseSettings);
    engine.start();
    engine.setMt5ConnectionStatus(false);

    const safety = engine.evaluateSafety(5, 0);
    assert(!safety.isSafeToTrade, 'MT5 disconnected must block trades');
    assert(safety.isMt5Disconnected === true, 'isMt5Disconnected flag must be true');

    results.push({ name: '11. MT5 Disconnected Block', passed: true, details: 'MT5 disconnection flagged and blocked by safety guard' });
  } catch (err: any) {
    results.push({ name: '11. MT5 Disconnected Block', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 12: Duplicate Protection
  // ----------------------------------------------------
  try {
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_' + executedOrders.length };
      }
    };
    const engine = new DaRaM1Engine(mockBroker as any, { ...baseSettings, liveTradingEnabled: true });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_dup', direction: 'BUY', sweepLevel: 1990, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 2005, mssTime: Date.now(),
      lockedEntryPrice: 2000, signalPrice: 2000,
      virtualSLPrice: 1970, virtualTPPrice: 2008,
      sharedSL: 1970, sharedTP: 2008
    }, engine.getUserSettings());

    // Execute L1
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 2000, high: 2000, low: 1998, close: 1998 }], openTradesCount: 0
    });
    assert(executedOrders.length === 1, '1 order for L1');

    // Repeated tick at same price L1
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998 }], openTradesCount: 1
    });
    assert(executedOrders.length === 1, 'Duplicate tick at L1 price did NOT trigger duplicate order');

    results.push({ name: '12. Duplicate Protection', passed: true, details: 'Level 1 executed once; duplicate ticks safely ignored' });
  } catch (err: any) {
    results.push({ name: '12. Duplicate Protection', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 13: Max Open Trades
  // ----------------------------------------------------
  try {
    const engine = new DaRaM1Engine({} as any, { ...baseSettings, maxOpenTrades: 3 });
    engine.start();

    const safetyAllowed = engine.evaluateSafety(5, 2);
    assert(safetyAllowed.isSafeToTrade, '2 trades < 3 allowed');

    const safetyBlocked = engine.evaluateSafety(5, 3);
    assert(!safetyBlocked.isSafeToTrade, '3 trades >= 3 blocked');
    assert(safetyBlocked.isMaxTradesReached === true, 'isMaxTradesReached flag set');

    results.push({ name: '13. Max Open Trades Enforcement', passed: true, details: 'Blocked when openTradesCount >= maxOpenTrades (3)' });
  } catch (err: any) {
    results.push({ name: '13. Max Open Trades Enforcement', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 14: Pending Setup Cancellation
  // ----------------------------------------------------
  try {
    const sm = new DaRaM1StateMachine();
    sm.onUserStart();
    sm.onSetupDetected({
      id: 'setup_cancel', direction: 'BUY', sweepLevel: 1990, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 2005, mssTime: Date.now(),
      lockedEntryPrice: 2000, signalPrice: 2000,
      virtualSLPrice: 1970, virtualTPPrice: 2008,
      sharedSL: 1970, sharedTP: 2008
    });

    assert(sm.getState() === 'WAIT_FOR_LOCKED_ENTRY', `State should be WAIT_FOR_LOCKED_ENTRY, got ${sm.getState()}`);
    sm.cancelSetup('USER_STOP', 'Opposite M1 MSS detected');
    assert(sm.getState() === 'SCANNING', 'State should return to SCANNING after cancellation');
    assert(sm.getSetup() === null, 'Setup must be cleared');

    results.push({ name: '14. Pending Setup Cancellation', passed: true, details: 'Setup properly cancelled and state returned to SCANNING' });
  } catch (err: any) {
    results.push({ name: '14. Pending Setup Cancellation', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 15: Trailing Remains Functional
  // ----------------------------------------------------
  try {
    const trailing = new DaRaProfitTrailing();

    // Mock active position
    const pos = {
      ticket: 'T_TRAIL_1',
      type: 'BUY' as const,
      openPrice: 2000,
      sl: 1970,
      tp: 2008,
      originalTp: 2008,
      lot: 0.02,
      openTime: Date.now()
    };

    // Price not yet at breakeven + trailing distance (2001 - 1.5 = 1999.5 < 2000) -> no trail
    const noTrail = trailing.calculateTrailingSL(pos, 2001, 2001, { trailingEnabled: true, trailingDistance: 1.5 });
    assert(noTrail.shouldModify === false, 'No trail before breakeven reached');

    // Price crosses breakeven + trailing distance (2005 - 1.5 = 2003.5 >= 2000) -> trail activates
    const trailActivated = trailing.calculateTrailingSL(pos, 2005, 2005, { trailingEnabled: true, trailingDistance: 1.5 });
    assert(trailActivated.shouldModify === true, 'Trailing activated when price reaches breakeven + trailing distance');
    assert(trailActivated.newSl === 2005 - 1.5, `New SL must be currentPrice - trailingDistance (${2005 - 1.5})`);

    results.push({ name: '15. Trailing Stop Functionality', passed: true, details: `Trailing triggered at ${trailActivated.newSl} after breakeven crossed` });
  } catch (err: any) {
    results.push({ name: '15. Trailing Stop Functionality', passed: false, details: err.message });
  }

  console.log('\n====================================================');
  console.log('📋 TEST SUITE SUMMARY RESULTS:');
  console.log('====================================================');
  let passedCount = 0;
  for (const r of results) {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} | ${r.name} - ${r.details || ''}`);
    if (r.passed) passedCount++;
  }
  console.log('====================================================');
  console.log(`TOTAL: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
