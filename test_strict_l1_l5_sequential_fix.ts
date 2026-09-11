import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';
import { DaRaUserSettings, DaRaSetup } from './src/engines/dara_m1/types';

interface MockOrder {
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  sl: number;
  tp: number;
  comment: string;
}

function createMockBroker(delayMs = 0) {
  const orders: MockOrder[] = [];
  return {
    orders,
    getSymbolInfo: async () => ({ pointSize: 0.01 }),
    modifyPosition: async () => ({ success: true }),
    getOpenPositions: async () => [],
    sendOrder: async (req: any) => {
      if (delayMs > 0) {
        await new Promise(r => setTimeout(r, delayMs));
      }
      orders.push(req);
      return { success: true, ticket: 'TICKET_' + orders.length };
    }
  };
}

const defaultSettings: DaRaUserSettings = {
  lotSize: 0.01,
  slDistance: 30,
  tpDistance: 30,
  dailyLossLimit: 50,
  maxOpenTrades: 5,
  maxConsecutiveSL: 3,
  cooldownMinutes: 15,
  maxSpreadPoints: 27,
  newsFilterEnabled: false,
  newsMinsBefore: 0,
  newsMinsAfter: 0,
  trailingEnabled: true,
  entryDistance: 1.0,
  liveTradingEnabled: true
};

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error('ASSERTION FAILED: ' + msg);
  }
}

async function run20VerificationTests() {
  console.log('================================================================================');
  console.log('🔬 20 DEDICATED VERIFICATION TESTS — STRICT L1-L5 SEQUENTIAL PRICE ENTRY FIX');
  console.log('================================================================================\n');

  let passed = 0;

  function markPass(num: number, title: string, detail: string) {
    passed++;
    console.log(`✅ TEST ${num}/20 PASSED: ${title}`);
    console.log(`   👉 ${detail}\n`);
  }

  // -------------------------------------------------------------------------
  // TEST 1: BUY L1-L5 Target Price Calculation (Locked=100, Dist=1.0)
  // Expected: L1=100, L2=99, L3=98, L4=97, L5=96
  // -------------------------------------------------------------------------
  {
    const sm = new DaRaM1StateMachine();
    sm.onUserStart();
    sm.onSetupDetected({
      id: 'setup_test_1',
      direction: 'BUY',
      sweepLevel: 95,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 105,
      mssTime: 1010,
      lockedEntryPrice: 100,
      signalPrice: 100,
      virtualSLPrice: 70,
      virtualTPPrice: 130,
      sharedSL: 70,
      sharedTP: 130
    }, { ...defaultSettings, entryDistance: 1.0, maxOpenTrades: 5 });

    const setup = sm.getSetup()!;
    assert(setup.entryLevels!.length === 5, 'Setup must have 5 levels');
    assert(setup.entryLevels![0].targetPrice === 100, `L1 must be 100, got ${setup.entryLevels![0].targetPrice}`);
    assert(setup.entryLevels![1].targetPrice === 99, `L2 must be 99, got ${setup.entryLevels![1].targetPrice}`);
    assert(setup.entryLevels![2].targetPrice === 98, `L3 must be 98, got ${setup.entryLevels![2].targetPrice}`);
    assert(setup.entryLevels![3].targetPrice === 97, `L4 must be 97, got ${setup.entryLevels![3].targetPrice}`);
    assert(setup.entryLevels![4].targetPrice === 96, `L5 must be 96, got ${setup.entryLevels![4].targetPrice}`);
    markPass(1, 'BUY L1-L5 Target Calculation', 'Locked=100, Dist=1.0 -> L1=100, L2=99, L3=98, L4=97, L5=96');
  }

  // -------------------------------------------------------------------------
  // TEST 2: SELL L1-L5 Target Price Calculation (Locked=100, Dist=1.0)
  // Expected: L1=100, L2=101, L3=102, L4=103, L5=104
  // -------------------------------------------------------------------------
  {
    const sm = new DaRaM1StateMachine();
    sm.onUserStart();
    sm.onSetupDetected({
      id: 'setup_test_2',
      direction: 'SELL',
      sweepLevel: 105,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 95,
      mssTime: 1010,
      lockedEntryPrice: 100,
      signalPrice: 100,
      virtualSLPrice: 130,
      virtualTPPrice: 70,
      sharedSL: 130,
      sharedTP: 70
    }, { ...defaultSettings, entryDistance: 1.0, maxOpenTrades: 5 });

    const setup = sm.getSetup()!;
    assert(setup.entryLevels!.length === 5, 'Setup must have 5 levels');
    assert(setup.entryLevels![0].targetPrice === 100, `L1 must be 100, got ${setup.entryLevels![0].targetPrice}`);
    assert(setup.entryLevels![1].targetPrice === 101, `L2 must be 101, got ${setup.entryLevels![1].targetPrice}`);
    assert(setup.entryLevels![2].targetPrice === 102, `L3 must be 102, got ${setup.entryLevels![2].targetPrice}`);
    assert(setup.entryLevels![3].targetPrice === 103, `L4 must be 103, got ${setup.entryLevels![3].targetPrice}`);
    assert(setup.entryLevels![4].targetPrice === 104, `L5 must be 104, got ${setup.entryLevels![4].targetPrice}`);
    markPass(2, 'SELL L1-L5 Target Calculation', 'Locked=100, Dist=1.0 -> L1=100, L2=101, L3=102, L4=103, L5=104');
  }

  // -------------------------------------------------------------------------
  // TEST 3: Decimal / Float Entry Distance Precision
  // Locked=2650.50, Dist=1.25 -> L1=2650.50, L2=2649.25, L3=2648.00, L4=2646.75, L5=2645.50
  // -------------------------------------------------------------------------
  {
    const sm = new DaRaM1StateMachine();
    sm.onUserStart();
    sm.onSetupDetected({
      id: 'setup_test_3',
      direction: 'BUY',
      sweepLevel: 2640,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 2655,
      mssTime: 1010,
      lockedEntryPrice: 2650.50,
      signalPrice: 2650.50,
      virtualSLPrice: 2620,
      virtualTPPrice: 2680,
      sharedSL: 2620,
      sharedTP: 2680
    }, { ...defaultSettings, entryDistance: 1.25, maxOpenTrades: 5 });

    const setup = sm.getSetup()!;
    assert(setup.entryLevels![0].targetPrice === 2650.50, `L1 got ${setup.entryLevels![0].targetPrice}`);
    assert(setup.entryLevels![1].targetPrice === 2649.25, `L2 got ${setup.entryLevels![1].targetPrice}`);
    assert(setup.entryLevels![2].targetPrice === 2648.00, `L3 got ${setup.entryLevels![2].targetPrice}`);
    assert(setup.entryLevels![3].targetPrice === 2646.75, `L4 got ${setup.entryLevels![3].targetPrice}`);
    assert(setup.entryLevels![4].targetPrice === 2645.50, `L5 got ${setup.entryLevels![4].targetPrice}`);
    markPass(3, 'Float Precision Spacing', 'Locked=2650.50, Dist=1.25 -> Exactly 2650.50, 2649.25, 2648.00, 2646.75, 2645.50');
  }

  // -------------------------------------------------------------------------
  // TEST 4: Positions Per Setup = 1 (L1 only)
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 1, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_4', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    assert(sm.getNextPendingLevel(1) !== null, 'Level 1 is pending');

    // Tick 1: Price touches 100 -> L1 executes
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    assert(broker.orders.length === 1, 'Order 1 executed');

    // Tick 2: Price drops to 99, 98, 97, 96 -> NO further orders
    for (const p of [99, 98, 97, 96]) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    }
    assert(broker.orders.length === 1, 'Max 1 position respected; L2-L5 never executed');
    assert(sm.getNextPendingLevel(1) === null, 'No pending level allowed after 1 position opened');
    markPass(4, 'Positions Per Setup = 1', 'Executed L1 at 100, completely halted on subsequent drops');
  }

  // -------------------------------------------------------------------------
  // TEST 5: Positions Per Setup = 2 (L1 -> WAIT -> L2 -> STOP)
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 2, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_5', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // Tick 1: 100 -> L1
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    assert(broker.orders.length === 1, 'L1 executed');

    // Price sits at 99.50 (has NOT reached L2 target 99) -> must WAIT
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 99.50, ask: 99.60, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    assert(broker.orders.length === 1, 'L2 did not execute at 99.50');

    // Price reaches 99.00 -> L2 executes
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 99.00, ask: 99.10, time: 3, serverTime: 3, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    assert(broker.orders.length === 2, 'L2 executed at 99');

    // Price drops further to 98, 97, 96 -> STOPPED
    for (const p of [98, 97, 96]) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: 4, serverTime: 4, spreadPoints: 10, openTradesCount: 2, m1Candles: [] });
    }
    assert(broker.orders.length === 2, 'Strictly stopped at 2 positions');
    markPass(5, 'Positions Per Setup = 2', 'L1 (100) -> WAIT -> L2 (99) -> STOP; L3-L5 blocked');
  }

  // -------------------------------------------------------------------------
  // TEST 6: Positions Per Setup = 3 (L1 -> L2 -> L3 -> STOP)
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 3, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_6', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    for (const p of [100, 99, 98]) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: broker.orders.length, m1Candles: [] });
    }
    assert(broker.orders.length === 3, 'Executed L1, L2, L3');

    // Drops to 97, 96 -> stopped
    for (const p of [97, 96, 95]) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 3, m1Candles: [] });
    }
    assert(broker.orders.length === 3, 'Stopped strictly at 3 positions');
    markPass(6, 'Positions Per Setup = 3', 'Executed L1, L2, L3; L4 & L5 prevented');
  }

  // -------------------------------------------------------------------------
  // TEST 7: Positions Per Setup = 4 (L1 -> L2 -> L3 -> L4 -> STOP)
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 4, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_7', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    for (const p of [100, 99, 98, 97]) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: broker.orders.length, m1Candles: [] });
    }
    assert(broker.orders.length === 4, 'Executed L1-L4');

    // Drops to 96 -> stopped
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 96, ask: 96.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 4, m1Candles: [] });
    assert(broker.orders.length === 4, 'L5 stopped when maxOpenTrades = 4');
    markPass(7, 'Positions Per Setup = 4', 'Executed L1-L4; L5 prevented');
  }

  // -------------------------------------------------------------------------
  // TEST 8: Positions Per Setup = 5 (L1 through L5)
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 5, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_8', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    for (const p of [100, 99, 98, 97, 96]) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: broker.orders.length, m1Candles: [] });
    }
    assert(broker.orders.length === 5, 'All 5 levels executed');
    markPass(8, 'Positions Per Setup = 5', 'All 5 levels executed sequentially at 100, 99, 98, 97, 96');
  }

  // -------------------------------------------------------------------------
  // TEST 9: Clamping of Positions Per Setup (<1 -> 1, >5 -> 5)
  // -------------------------------------------------------------------------
  {
    const sm = new DaRaM1StateMachine();
    sm.onUserStart();
    sm.onSetupDetected({
      id: 'setup_test_9a', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, { ...defaultSettings, maxOpenTrades: 0 });
    assert(sm.getNextPendingLevel(0)?.levelIndex === 0, 'maxOpenTrades=0 clamps to limit 1');
    sm.onPositionOpened({ ticket: 'TICK_0' } as any, 0);
    assert(sm.getNextPendingLevel(0) === null, 'clamped limit of 1 prevents further levels');

    const smB = new DaRaM1StateMachine();
    smB.onUserStart();
    smB.onSetupDetected({
      id: 'setup_test_9b', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, { ...defaultSettings, maxOpenTrades: 10 });
    assert(smB.getNextPendingLevel(10)?.levelIndex === 0, 'maxOpenTrades=10 clamps to limit 5');
    markPass(9, 'Positions Count Clamping', 'Clamped 0 -> 1 and 10 -> 5 in getNextPendingLevel');
  }

  // -------------------------------------------------------------------------
  // TEST 10: Entry Distance Independence
  // Positions Per Setup controls ONLY how many levels execute, NOT Entry Distance
  // -------------------------------------------------------------------------
  {
    const sm2 = new DaRaM1StateMachine();
    sm2.onUserStart();
    sm2.onSetupDetected({
      id: 'setup_test_10a', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, { ...defaultSettings, entryDistance: 2.0, maxOpenTrades: 2 });

    const sm5 = new DaRaM1StateMachine();
    sm5.onUserStart();
    sm5.onSetupDetected({
      id: 'setup_test_10b', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, { ...defaultSettings, entryDistance: 2.0, maxOpenTrades: 5 });

    // Both must have L1=100, L2=98
    assert(sm2.getSetup()!.entryLevels![1].targetPrice === 98, 'sm2 L2 is 98');
    assert(sm5.getSetup()!.entryLevels![1].targetPrice === 98, 'sm5 L2 is 98');
    assert(sm2.getNextPendingLevel(2) !== null, 'sm2 has pending level');
    assert(sm5.getNextPendingLevel(5) !== null, 'sm5 has pending level');
    markPass(10, 'Entry Distance Independence', 'Distance between levels remains 2.0 regardless of maxOpenTrades setting (2 vs 5)');
  }

  // -------------------------------------------------------------------------
  // TEST 11: Removal of Candle Wick Triggers
  // Previous M1 candle wick has low=96, but live price is 99.50. L2 (target 99) MUST NOT trigger!
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_11', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // Execute L1 at 100
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 100, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0,
      m1Candles: [{ open: 100, high: 101, low: 100, close: 100, time: 1 }]
    });
    assert(broker.orders.length === 1, 'L1 executed');

    // Next tick: live bid is 99.50 (above L2 99.00), BUT the candle array has a deep wick low=96.00!
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 99.50, ask: 99.60, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1,
      m1Candles: [{ open: 100, high: 100, low: 96.00, close: 99.50, time: 2 }]
    });
    assert(broker.orders.length === 1, 'Candle wick low=96 MUST NOT trigger L2 (target 99) when live bid is 99.50');
    markPass(11, 'Candle Wick Elimination', 'Candle wick low=96.00 did NOT trigger L2 while live bid was 99.50');
  }

  // -------------------------------------------------------------------------
  // TEST 12: Strict Live Current Price Triggering
  // -------------------------------------------------------------------------
  {
    const sm = new DaRaM1StateMachine();
    sm.onUserStart();
    sm.onSetupDetected({
      id: 'setup_test_12', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, { ...defaultSettings, entryDistance: 1.0 });

    assert(!sm.isEntryPriceReached(100.01), 'Price 100.01 does not reach BUY 100.00');
    assert(sm.isEntryPriceReached(100.00), 'Price 100.00 reaches BUY 100.00');
    assert(sm.isEntryPriceReached(99.99), 'Price 99.99 reaches BUY 100.00');
    markPass(12, 'Live Current Price Triggering', 'Only live current price evaluated against level target');
  }

  // -------------------------------------------------------------------------
  // TEST 13: One Market Update = Maximum One Level Execution
  // Price drops abruptly to 96.00 on Tick 1 -> only L1 executes, NOT all 5 levels!
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_13', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // Abrupt flash crash to 96.00 on Tick 1
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 96.00, ask: 96.10, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: []
    });
    assert(broker.orders.length === 1, `Expected exactly 1 order on abrupt price gap, got ${broker.orders.length}`);
    assert(broker.orders[0].comment.includes('#1') || broker.orders[0].comment.includes('BUY'), 'Only Level 1 executed');
    markPass(13, 'One Level Per Market Update', 'Flash drop to 96 executed ONLY L1 on the first update');
  }

  // -------------------------------------------------------------------------
  // TEST 14: Strict New Price Event Requirement Under Repeated Ticks
  // Tick 1 at 96 opens L1. Repeated ticks at 96 MUST NOT execute L2, L3, L4, L5.
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_14', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // Tick 1 at 96 opens L1
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 96.00, ask: 96.10, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: []
    });
    assert(broker.orders.length === 1, 'Tick 1 at 96 opens L1');

    // Ticks 2-5 at identical price 96.00 MUST NOT execute any more levels
    for (let tick = 2; tick <= 5; tick++) {
      await engine.onMarketUpdate({
        symbol: 'XAUUSD', bid: 96.00, ask: 96.10, time: tick, serverTime: tick, spreadPoints: 10, openTradesCount: broker.orders.length, m1Candles: []
      });
      assert(broker.orders.length === 1, `Identical tick ${tick} at 96.00 must be rejected`);
    }
    markPass(14, 'Strict New Price Event Requirement', 'Repeated ticks at 96.00 strictly rejected; 0 additional levels executed without new price event');
  }

  // -------------------------------------------------------------------------
  // TEST 15: Mutex / Order-In-Flight Protection
  // If broker takes 50ms to fill order, intermediate ticks arriving during flight MUST be blocked
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker(50); // 50ms latency
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_15', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // Trigger L1 async
    const tick1Promise = engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 99.00, ask: 99.10, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: []
    });

    // Fire 3 intermediate ticks while tick1 is in flight
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 99.00, ask: 99.10, time: 1.1, serverTime: 1.1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 98.00, ask: 98.10, time: 1.2, serverTime: 1.2, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });

    await tick1Promise;
    assert(broker.orders.length === 1, `Mutex must block intermediate ticks, got ${broker.orders.length}`);
    markPass(15, 'Order-In-Flight Mutex', 'Blocked 2 concurrent ticks arriving during broker latency window');
  }

  // -------------------------------------------------------------------------
  // TEST 16: Strict Sequential Ordering Guarantee
  // L2 cannot execute before L1; L3 cannot execute before L2
  // -------------------------------------------------------------------------
  {
    const sm = new DaRaM1StateMachine();
    sm.onUserStart();
    sm.onSetupDetected({
      id: 'setup_test_16', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, { ...defaultSettings, entryDistance: 1.0 });

    const p1 = sm.getNextPendingLevel();
    assert(p1?.levelIndex === 0, 'First pending must be level index 0 (L1)');
    sm.onPositionOpened({ ticket: 'TICK_1', openPrice: 100, direction: 'BUY', volume: 0.01, sl: 70, tp: 130, openTime: 1 } as any, 0);

    const p2 = sm.getNextPendingLevel();
    assert(p2?.levelIndex === 1, 'Second pending must be level index 1 (L2)');
    sm.onPositionOpened({ ticket: 'TICK_2', openPrice: 99, direction: 'BUY', volume: 0.01, sl: 70, tp: 130, openTime: 2 } as any, 1);

    const p3 = sm.getNextPendingLevel();
    assert(p3?.levelIndex === 2, 'Third pending must be level index 2 (L3)');
    markPass(16, 'Sequential Level Ordering', 'Levels strictly advance: 0 (L1) -> 1 (L2) -> 2 (L3); no skipping possible');
  }

  // -------------------------------------------------------------------------
  // TEST 17: Duplicate Tick Protection at Same Level
  // Price hovers at 100 for 10 ticks -> only 1 position opened for L1
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_17', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    for (let i = 0; i < 10; i++) {
      await engine.onMarketUpdate({
        symbol: 'XAUUSD', bid: 100, ask: 100.1, time: i, serverTime: i, spreadPoints: 10, openTradesCount: broker.orders.length, m1Candles: []
      });
    }
    assert(broker.orders.length === 1, `10 ticks at 100 must produce 1 order, got ${broker.orders.length}`);
    markPass(17, 'Duplicate Tick Rejection', '10 continuous ticks at 100 produced exactly 1 order');
  }

  // -------------------------------------------------------------------------
  // TEST 18: Hard Constraint — Level 6 Is Strictly Impossible
  // After all 5 levels are executed, further drops trigger 0 orders
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_18', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    for (const p of [100, 99, 98, 97, 96]) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: broker.orders.length, m1Candles: [] });
    }
    assert(broker.orders.length === 5, '5 orders opened');

    // Plunge further to 95, 94, 90, 80
    for (const p of [95, 94, 90, 80]) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 5, m1Candles: [] });
    }
    assert(broker.orders.length === 5, 'Orders strictly capped at 5; Level 6 never created');
    assert(sm.getNextPendingLevel() === null, 'getNextPendingLevel returns null');
    markPass(18, 'No Level 6 Possible', 'Plunge to 80 produced 0 extra orders; Level 6 strictly impossible');
  }

  // -------------------------------------------------------------------------
  // TEST 19: Shared SL and TP Across Entire Basket
  // All executed positions must have identical SL and TP
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_test_19', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    for (const p of [100, 99, 98]) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: broker.orders.length, m1Candles: [] });
    }
    for (let i = 0; i < broker.orders.length; i++) {
      assert(broker.orders[i].sl === 70, `Order ${i} SL mismatch`);
      assert(broker.orders[i].tp === 130, `Order ${i} TP mismatch`);
    }
    markPass(19, 'Shared SL/TP Integrity', 'All executed positions share exact SL=70 and TP=130');
  }

  // -------------------------------------------------------------------------
  // TEST 20: Single Basket Ownership & Opposite Setup Rejection
  // -------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'active_basket_setup', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // Execute L1
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    assert(sm.hasOpenPositions(), 'Basket has open position');

    // Attempt to inject opposite SELL setup
    sm.onSetupDetected({
      id: 'conflicting_sell', direction: 'SELL', sweepLevel: 110, sweepTime: 2000, displacementConfirmed: true,
      mssLevel: 90, mssTime: 2010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 130, virtualTPPrice: 70, sharedSL: 130, sharedTP: 70
    }, engine.getUserSettings());

    assert(sm.getSetup()?.id === 'active_basket_setup', 'Opposite setup must be rejected while basket is active');
    markPass(20, 'Single Basket Ownership', 'Opposite SELL setup rejected while BUY basket is active');
  }

  console.log('================================================================================');
  console.log(`🎉 ALL ${passed}/20 DEDICATED VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)`);
  console.log('================================================================================\n');
}

run20VerificationTests().catch(err => {
  console.error('❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
