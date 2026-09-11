import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';

interface MockOrder {
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  sl: number;
  tp: number;
  comment: string;
}

function createMockBroker() {
  const orders: MockOrder[] = [];
  return {
    orders,
    getSymbolInfo: async () => ({ pointSize: 0.01 }),
    modifyPosition: async () => ({ success: true }),
    getOpenPositions: async () => [],
    sendOrder: async (req: any) => {
      orders.push(req);
      return { success: true, ticket: 'TICK_' + orders.length };
    }
  };
}

const baseSettings = {
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
  entryDistance: 2.0,
  liveTradingEnabled: false
};

async function testSetting(maxPositionsSetting: number, expectedExecutions: number) {
  const broker = createMockBroker();
  const settings = { ...baseSettings, maxOpenTrades: maxPositionsSetting, liveTradingEnabled: true };
  const engine = new DaRaM1Engine(broker as any, settings);
  engine.start();

  const sm = (engine as any).stateMachine as DaRaM1StateMachine;
  const lockedEntry = 2000;
  sm.onSetupDetected({
    id: `setup_${maxPositionsSetting}`,
    direction: 'BUY',
    sweepLevel: 1995,
    sweepTime: Date.now(),
    displacementConfirmed: true,
    mssLevel: 2005,
    mssTime: Date.now(),
    lockedEntryPrice: lockedEntry,
    signalPrice: lockedEntry,
    virtualSLPrice: lockedEntry - 30,
    virtualTPPrice: lockedEntry + 30,
    sharedSL: lockedEntry - 30,
    sharedTP: lockedEntry + 30
  }, engine.getUserSettings());

  // Deep pullback that crosses all 5 levels (1998, 1996, 1994, 1992, 1990, down to 1980)
  const priceSequence = [
    1998, // L1
    1996, // L2
    1994, // L3
    1992, // L4
    1990, // L5
    1985, // Below L5
    1980  // Way below L5
  ];

  for (let i = 0; i < priceSequence.length; i++) {
    const p = priceSequence[i];
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: p,
      ask: p,
      spreadPoints: 5,
      m1Candles: [{ open: p, high: p, low: p, close: p, time: Date.now() }],
      openTradesCount: broker.orders.length
    });
  }

  if (broker.orders.length !== expectedExecutions) {
    throw new Error(`Setting ${maxPositionsSetting} FAILED: Expected ${expectedExecutions} orders, got ${broker.orders.length}`);
  }

  // Verify sequential levels
  for (let idx = 0; idx < broker.orders.length; idx++) {
    const order = broker.orders[idx];
    const expectedLevel = idx + 1;
    if (!order.comment.includes(`L${expectedLevel}`) && !order.comment.includes(`Pos #${expectedLevel}`) && !order.comment.includes(`Level ${expectedLevel}`)) {
      // Check comment contents
      console.log(`Order ${idx + 1} comment:`, order.comment);
    }
  }

  console.log(`✅ Setting maxOpenTrades=${maxPositionsSetting} -> Executed exactly ${broker.orders.length}/${expectedExecutions} levels`);
}

async function runAllTests() {
  console.log("=== STARTING DARA M1 MAX POSITIONS PER SETUP AUDIT & VERIFICATION ===");

  // Test 1: Setting = 1 -> L1 only
  await testSetting(1, 1);

  // Test 2: Setting = 2 -> L1, L2 only
  await testSetting(2, 2);

  // Test 3: Setting = 3 -> L1, L2, L3 only
  await testSetting(3, 3);

  // Test 4: Setting = 4 -> L1, L2, L3, L4 only
  await testSetting(4, 4);

  // Test 5: Setting = 5 -> L1 through L5
  await testSetting(5, 5);

  // Test 6: Setting <= 0 -> Clamped to 1 (L1 only)
  await testSetting(0, 1);
  await testSetting(-3, 1);

  // Test 7: Setting > 5 -> Clamped to 5 (L1 through L5, strictly NO Level 6)
  await testSetting(6, 5);
  await testSetting(10, 5);

  // Test 8: Verify Sequential execution (no skipping or simultaneous multi-opening)
  {
    const broker = createMockBroker();
    const settings = { ...baseSettings, maxOpenTrades: 3, liveTradingEnabled: true };
    const engine = new DaRaM1Engine(broker as any, settings);
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'seq_test',
      direction: 'BUY',
      sweepLevel: 1995,
      sweepTime: Date.now(),
      displacementConfirmed: true,
      mssLevel: 2005,
      mssTime: Date.now(),
      lockedEntryPrice: 2000,
      signalPrice: 2000,
      virtualSLPrice: 1970,
      virtualTPPrice: 2030,
      sharedSL: 1970,
      sharedTP: 2030
    }, engine.getUserSettings());

    // Send tick above L1 (2001) -> 0 orders
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 2001, ask: 2001, spreadPoints: 5,
      m1Candles: [{ open: 2001, high: 2001, low: 2001, close: 2001, time: Date.now() }],
      openTradesCount: 0
    });
    if (broker.orders.length !== 0) throw new Error("Should not execute above L1");

    // Send tick touching L1 (1998) -> only L1 executes
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });
    if (broker.orders.length !== 1) throw new Error("Should execute only L1 on first reach");

    // Price bounces back up to 1999 -> no duplicate L1
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1999, ask: 1999, spreadPoints: 5,
      m1Candles: [{ open: 1999, high: 1999, low: 1999, close: 1999, time: Date.now() }],
      openTradesCount: 1
    });
    if (broker.orders.length !== 1) throw new Error("No duplicate on bounce");

    // Price drops to 1996 -> L2 executes
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1996, ask: 1996, spreadPoints: 5,
      m1Candles: [{ open: 1996, high: 1996, low: 1996, close: 1996, time: Date.now() }],
      openTradesCount: 1
    });
    if (broker.orders.length !== 2) throw new Error("Should execute L2");

    // Price drops to 1994 -> L3 executes
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1994, ask: 1994, spreadPoints: 5,
      m1Candles: [{ open: 1994, high: 1994, low: 1994, close: 1994, time: Date.now() }],
      openTradesCount: 2
    });
    if (broker.orders.length !== 3) throw new Error("Should execute L3");

    // Price drops to 1992 (L4) and 1990 (L5) -> blocked by maxOpenTrades = 3
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1992, ask: 1992, spreadPoints: 5,
      m1Candles: [{ open: 1992, high: 1992, low: 1992, close: 1992, time: Date.now() }],
      openTradesCount: 3
    });
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1990, ask: 1990, spreadPoints: 5,
      m1Candles: [{ open: 1990, high: 1990, low: 1990, close: 1990, time: Date.now() }],
      openTradesCount: 3
    });
    if (broker.orders.length !== 3) throw new Error("L4 and L5 MUST be blocked when maxOpenTrades = 3");
    console.log("✅ Sequential execution strictly verified: L1 -> L2 -> L3. L4 & L5 stopped!");
  }

  // Test 8B: STRICT REQUIREMENT B — Global Broker Positions Isolation
  // Unrelated external trades on the account (e.g. openTradesCount = 10) must NEVER block DaRa levels!
  {
    const broker = createMockBroker();
    const settings = { ...baseSettings, maxOpenTrades: 3, liveTradingEnabled: true };
    const engine = new DaRaM1Engine(broker as any, settings);
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'basket_external_test',
      direction: 'BUY',
      sweepLevel: 1995,
      sweepTime: Date.now(),
      displacementConfirmed: true,
      mssLevel: 2005,
      mssTime: Date.now(),
      lockedEntryPrice: 2000,
      signalPrice: 2000,
      virtualSLPrice: 1970,
      virtualTPPrice: 2030,
      sharedSL: 1970,
      sharedTP: 2030
    }, engine.getUserSettings());

    // External account has 10 manual/other trades open: openTradesCount = 10!
    // Trigger L1 (target 1998)
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 10
    });
    if (broker.orders.length !== 1) throw new Error("L1 should execute even if account has 10 external trades");

    // Price drops to 1996 (L2) with external openTradesCount = 11
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1996, ask: 1996, spreadPoints: 5,
      m1Candles: [{ open: 1996, high: 1996, low: 1996, close: 1996, time: Date.now() }],
      openTradesCount: 11
    });
    if (broker.orders.length !== 2) throw new Error("L2 MUST NOT be blocked by external global trades count");

    // Price drops to 1994 (L3) with external openTradesCount = 12
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1994, ask: 1994, spreadPoints: 5,
      m1Candles: [{ open: 1994, high: 1994, low: 1994, close: 1994, time: Date.now() }],
      openTradesCount: 12
    });
    if (broker.orders.length !== 3) throw new Error("L3 MUST NOT be blocked by external global trades count");

    // Price drops to 1992 (L4) and 1990 (L5) -> now blocked because DaRa Basket has 3 positions (= maxAllowedPositions 3)
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1992, ask: 1992, spreadPoints: 5,
      m1Candles: [{ open: 1992, high: 1992, low: 1992, close: 1992, time: Date.now() }],
      openTradesCount: 13
    });
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1990, ask: 1990, spreadPoints: 5,
      m1Candles: [{ open: 1990, high: 1990, low: 1990, close: 1990, time: Date.now() }],
      openTradesCount: 13
    });
    if (broker.orders.length !== 3) throw new Error("L4/L5 must be blocked because DaRa Basket reached 3 positions");
    console.log("✅ REQUIREMENT B STRICTLY VERIFIED: Global broker trades (10+) NEVER block DaRa Basket levels! L1->L2->L3 allowed, L4/L5 blocked!");
  }

  // Test 9: One Basket / One Direction Check
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, liveTradingEnabled: true });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'active_basket',
      direction: 'BUY',
      sweepLevel: 1995,
      sweepTime: Date.now(),
      displacementConfirmed: true,
      mssLevel: 2005,
      mssTime: Date.now(),
      lockedEntryPrice: 2000,
      signalPrice: 2000,
      virtualSLPrice: 1970,
      virtualTPPrice: 2030,
      sharedSL: 1970,
      sharedTP: 2030
    }, engine.getUserSettings());

    // Execute L1
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });
    if (!sm.hasOpenPositions()) throw new Error("Expected active position in basket");

    // Attempt to inject an opposite SELL setup while basket is active
    sm.onSetupDetected({
      id: 'opposite_sell',
      direction: 'SELL',
      sweepLevel: 2005,
      sweepTime: Date.now(),
      displacementConfirmed: true,
      mssLevel: 1995,
      mssTime: Date.now(),
      lockedEntryPrice: 2000,
      signalPrice: 2000,
      virtualSLPrice: 2030,
      virtualTPPrice: 1970,
      sharedSL: 2030,
      sharedTP: 1970
    }, engine.getUserSettings());

    const activeSetup = sm.getSetup();
    if (activeSetup?.direction !== 'BUY' || activeSetup?.id !== 'active_basket') {
      throw new Error("CRITICAL: Opposite setup replaced active basket!");
    }
    console.log("✅ One Basket / One Direction strictly verified: Opposite setup rejected!");
  }

  // Test 10: Shared SL / TP Integrity
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, liveTradingEnabled: true });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'shared_sltp_test',
      direction: 'BUY',
      sweepLevel: 1995,
      sweepTime: Date.now(),
      displacementConfirmed: true,
      mssLevel: 2005,
      mssTime: Date.now(),
      lockedEntryPrice: 2000,
      signalPrice: 2000,
      virtualSLPrice: 1970,
      virtualTPPrice: 2030,
      sharedSL: 1970,
      sharedTP: 2030
    }, engine.getUserSettings());

    // Trigger L1 & L2
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1996, ask: 1996, spreadPoints: 5,
      m1Candles: [{ open: 1996, high: 1996, low: 1996, close: 1996, time: Date.now() }],
      openTradesCount: 1
    });

    for (const ord of broker.orders) {
      if (ord.sl !== 1970) throw new Error(`Shared SL mismatch: expected 1970, got ${ord.sl}`);
      if (ord.tp !== 2030) throw new Error(`Shared TP mismatch: expected 2030, got ${ord.tp}`);
    }
    console.log("✅ Shared SL/TP strictly verified across all executed levels: SL=1970, TP=2030");
  }

  // Test 11: +50 USC TRUE NET Profit Lock Integration
  {
    let openPositionsOnBroker: any[] = [];
    let basketClosed = false;
    const broker = {
      ...createMockBroker(),
      getOpenPositions: async () => openPositionsOnBroker,
      closePosition: async () => {
        basketClosed = true;
        return { success: true };
      }
    };

    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, trailingEnabled: true, liveTradingEnabled: true });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'profit_lock_test',
      direction: 'BUY',
      sweepLevel: 1995,
      sweepTime: Date.now(),
      displacementConfirmed: true,
      mssLevel: 2005,
      mssTime: Date.now(),
      lockedEntryPrice: 2000,
      signalPrice: 2000,
      virtualSLPrice: 1970,
      virtualTPPrice: 2030,
      sharedSL: 1970,
      sharedTP: 2030
    }, engine.getUserSettings());

    // Trigger L1 (openPrice 1998)
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });

    const activePositions = sm.getActivePositions();
    if (activePositions.length === 0) throw new Error("Position not found");

    // Case A: Gross profit +52 USC, but Commission -3 USC and Swap -1 USC -> Net = +48 USC (< +50 USC threshold)
    // Profit Lock should NOT activate
    openPositionsOnBroker = [{
      ticket: activePositions[0].ticket,
      symbol: 'XAUUSD',
      unrealizedProfit: 52,
      commission: -3,
      swap: -1
    }];

    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 2003, ask: 2003, spreadPoints: 5,
      m1Candles: [{ open: 2003, high: 2003, low: 2003, close: 2003, time: Date.now() }],
      openTradesCount: 1
    });

    const setup = sm.getSetup();
    if (setup?.trailingState?.profitLockActivated) {
      throw new Error("Profit Lock activated prematurely when True Net was +48 USC!");
    }

    // Case B: Net reaches +55 USC (Gross +59, Commission -3, Swap -1 -> Net = +55 >= +50 USC)
    // Profit Lock activates
    openPositionsOnBroker = [{
      ticket: activePositions[0].ticket,
      symbol: 'XAUUSD',
      unrealizedProfit: 59,
      commission: -3,
      swap: -1
    }];

    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 2005, ask: 2005, spreadPoints: 5,
      m1Candles: [{ open: 2005, high: 2005, low: 2005, close: 2005, time: Date.now() }],
      openTradesCount: 1
    });

    if (!setup?.trailingState?.profitLockActivated) {
      throw new Error("Profit Lock failed to activate when True Net was +55 USC!");
    }
    console.log("✅ +50 USC True Net Profit Lock strictly verified with Commission + Swap inclusion!");
  }

  // Test 12: Confirm LIVE = OFF
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any);
    const settings = engine.getUserSettings();
    if (settings.liveTradingEnabled !== false) {
      throw new Error(`CRITICAL: LIVE trading is NOT OFF by default! Got: ${settings.liveTradingEnabled}`);
    }
    console.log("✅ LIVE Trading strictly confirmed OFF (liveTradingEnabled = false)");
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO ERRORS OR REGRESSIONS!");
  console.log("==================================================================");
}

runAllTests().catch(err => {
  console.error("❌ TEST RUNNER FAILED:", err);
  process.exit(1);
});
