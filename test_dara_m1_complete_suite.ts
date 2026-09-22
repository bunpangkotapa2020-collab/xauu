import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';
import { DaRaOrderExecution } from './src/engines/dara_m1/DaRaOrderExecution';
import * as fs from 'fs';
import * as path from 'path';

function cleanState() {
  const filePath = path.join(process.cwd(), 'data', 'dara_m1_state.json');
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

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
    entryDistance: 2.0,
    liveTradingEnabled: false,
  };

  // ----------------------------------------------------
  // Test 1: 5-level BUY
  // ----------------------------------------------------
  try {
    cleanState();
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
    cleanState();
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
    cleanState();
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
      m1Candles: [{ open: 2002, high: 2002, low: 1998, close: 1998 }], openTradesCount: 0
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
    cleanState();
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
  // Test 5: Authoritative SL/TP (Actual Fill Based)
  // ----------------------------------------------------
  try {
    cleanState();
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

    // Authoritative Rule: SL/TP based on ACTUAL FILL
    // L1 Fill = 2498. SL dist 25, TP dist 10. SL = 2473, TP = 2508
    assert(order1.sl === 2473, `Order 1 SL must be 2473, got ${order1.sl}`);
    assert(order1.tp === 2508, `Order 1 TP must be 2508, got ${order1.tp}`);
    
    // L2 Fill = 2496. SL dist 25, TP dist 10. SL = 2471, TP = 2506
    assert(order2.sl === 2471, `Order 2 SL must be 2471, got ${order2.sl}`);
    assert(order2.tp === 2506, `Order 2 TP must be 2506, got ${order2.tp}`);

    results.push({ name: '5. Authoritative SL/TP (Actual Fill Based)', passed: true, details: `Order 1 SL: ${order1.sl}, TP: ${order1.tp} | Order 2 SL: ${order2.sl}, TP: ${order2.tp}` });
  } catch (err: any) {
    results.push({ name: '5. Authoritative SL/TP (Actual Fill Based)', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 6: Safety Guards
  // ----------------------------------------------------
  try {
    cleanState();
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
    cleanState();
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
    cleanState();
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
    cleanState();
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
    cleanState();
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
    cleanState();
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
    cleanState();
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
    cleanState();
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
    cleanState();
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
  // Test 15: Authoritative Rule Examples (User-Provided)
  // ----------------------------------------------------
  try {
    cleanState();
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.001 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_' + executedOrders.length };
      }
    };
    const engine = new DaRaM1Engine(mockBroker as any, { 
      ...baseSettings, 
      liveTradingEnabled: true, 
      slDistance: 8, 
      tpDistance: 10,
      entryDistance: 0
    });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    
    // Example BUY: Fill = 4350.000, SL=8, TP=10
    sm.onSetupDetected({
      id: 'setup_example_buy', direction: 'BUY', sweepLevel: 4340, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 4355, mssTime: Date.now(),
      lockedEntryPrice: 4350, signalPrice: 4350,
      virtualSLPrice: 4342, virtualTPPrice: 4360,
      sharedSL: 4342, sharedTP: 4360
    }, engine.getUserSettings());

    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 4350, ask: 4350, spreadPoints: 0,
      m1Candles: [{ open: 4350, high: 4350, low: 4350, close: 4350 }], openTradesCount: 0
    });

    const buyOrder = executedOrders[0];
    assert(buyOrder.sl === 4342, `BUY SL must be 4342, got ${buyOrder.sl}`);
    assert(buyOrder.tp === 4360, `BUY TP must be 4360, got ${buyOrder.tp}`);

    // Example SELL: Fill = 4350.000, SL=8, TP=10
    // Recreate engine to ensure state is SCANNING
    cleanState();
    const executedOrdersSell: any[] = [];
    const mockBrokerSell = {
      getSymbolInfo: async () => ({ pointSize: 0.001 }),
      sendOrder: async (req: any) => {
        executedOrdersSell.push(req);
        return { success: true, ticket: 'T_SELL' };
      }
    };
    const engineSell = new DaRaM1Engine(mockBrokerSell as any, { 
      ...baseSettings, 
      liveTradingEnabled: true, 
      slDistance: 8, 
      tpDistance: 10,
      entryDistance: 0
    });
    engineSell.start();
    (engineSell as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const smSell = (engineSell as any).stateMachine as DaRaM1StateMachine;
    smSell.onSetupDetected({
      id: 'setup_example_sell', direction: 'SELL', sweepLevel: 4360, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 4345, mssTime: Date.now(),
      lockedEntryPrice: 4350, signalPrice: 4350,
      virtualSLPrice: 4358, virtualTPPrice: 4340,
      sharedSL: 4358, sharedTP: 4340
    }, engineSell.getUserSettings());

    await engineSell.onMarketUpdate({
      symbol: 'XAUUSD', bid: 4350, ask: 4350, spreadPoints: 0,
      m1Candles: [{ open: 4350, high: 4350, low: 4350, close: 4350 }], openTradesCount: 0
    });

    const sellOrder = executedOrdersSell[0];
    assert(sellOrder.sl === 4358, `SELL SL must be 4358, got ${sellOrder.sl}`);
    assert(sellOrder.tp === 4340, `SELL TP must be 4340, got ${sellOrder.tp}`);

    results.push({ name: '15. Authoritative Rule Examples', passed: true, details: 'BUY(4350): SL 4342, TP 4360 | SELL(4350): SL 4358, TP 4340' });
  } catch (err: any) {
    results.push({ name: '15. Authoritative Rule Examples', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Test 16: Pullback Authoritative SL/TP (Trade #2 Bug Case)
  // ----------------------------------------------------
  try {
    cleanState();
    const executedOrders: any[] = [];
    const mockBroker = {
      getSymbolInfo: async () => ({ pointSize: 0.001 }),
      sendOrder: async (req: any) => {
        executedOrders.push(req);
        return { success: true, ticket: 'T_PULLBACK' };
      }
    };
    // User Settings: SL=8, TP=10
    const engine = new DaRaM1Engine(mockBroker as any, { 
      ...baseSettings, 
      liveTradingEnabled: true, 
      slDistance: 8, 
      tpDistance: 10,
      entryDistance: 0
    });
    engine.start();
    (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    
    // Trade #2 Case: 
    // Master Entry = 4354.709
    // Actual Fill = 4348.876
    const master = 4354.709;
    sm.onSetupDetected({
      id: 'setup_pullback_bug', direction: 'BUY', sweepLevel: 4340, sweepTime: Date.now(),
      displacementConfirmed: true, mssLevel: 4360, mssTime: Date.now(),
      lockedEntryPrice: master, signalPrice: master,
      virtualSLPrice: master - 8, virtualTPPrice: master + 10,
      sharedSL: master - 8, sharedTP: master + 10
    }, engine.getUserSettings());

    // Trigger L1 (Master - 1.0 = 4353.709)
    // BUT we simulate a GAP or deep pullback to 4348.876 in one tick
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 4348.876, ask: 4348.876, spreadPoints: 0,
      m1Candles: [{ open: 4355, high: 4355, low: 4348.876, close: 4348.876 }], openTradesCount: 0
    });

    const order = executedOrders[0];
    assert(order.openPrice === 4348.876, `Order should be filled at 4348.876, got ${order.openPrice}`);
    
    // Authoritative Rule:
    // SL = 4348.876 - 8 = 4340.876
    // TP = 4348.876 + 10 = 4358.876
    assert(order.sl === 4340.876, `Pullback SL must be 4340.876, got ${order.sl}`);
    assert(order.tp === 4358.876, `Pullback TP must be 4358.876, got ${order.tp}`);

    results.push({ name: '16. Pullback Authoritative SL/TP', passed: true, details: 'Fill: 4348.876 | SL: 4340.876, TP: 4358.876 (based on fill, NOT master)' });
  } catch (err: any) {
    results.push({ name: '16. Pullback Authoritative SL/TP', passed: false, details: err.message });
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
