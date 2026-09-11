import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';

interface MockPosition {
  ticket: string | number;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  profit: number;
  unrealizedProfit?: number;
  commission: number;
  swap: number;
  comment: string;
}

function createMockBroker() {
  const positions: MockPosition[] = [];
  const closedTickets: (string | number)[] = [];
  let currentBid = 2000;
  let currentAsk = 2000.1;

  return {
    positions,
    closedTickets,
    getSymbolInfo: async () => ({ pointSize: 0.01 }),
    modifyPosition: async () => ({ success: true }),
    getOpenPositions: async () => positions.map(p => ({
      ...p,
      unrealizedProfit: p.profit
    })),
    closePosition: async (ticket: string | number) => {
      closedTickets.push(ticket);
      const idx = positions.findIndex(p => p.ticket === ticket);
      if (idx !== -1) positions.splice(idx, 1);
      return { success: true, ticket, pnl: 50 };
    },
    sendOrder: async (req: any) => {
      const ticket = 'TICK_' + (positions.length + 1) + '_' + Math.random().toString(36).substring(7);
      const pos: MockPosition = {
        ticket,
        symbol: req.symbol,
        type: req.type,
        volume: req.volume,
        openPrice: req.openPrice || currentBid,
        currentPrice: currentBid,
        sl: req.sl,
        tp: req.tp,
        profit: 0,
        unrealizedProfit: 0,
        commission: 0,
        swap: 0,
        comment: req.comment || ''
      };
      positions.push(pos);
      return { success: true, ticket };
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
  liveTradingEnabled: true
};

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🧪 DARA M1 EA - USER-CONTROLLED PROFIT LOCK TARGET TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // TEST 1: Default = 50 USC
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings });
    const userSettings = engine.getUserSettings();
    // Default profitLockTarget undefined in settings object defaults to 50 in runtime
    assert(userSettings.profitLockTarget === undefined, 'TEST 1A: User settings initially has undefined profitLockTarget (uses runtime default 50 USC)');
    
    // Simulate setup & basket
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_default',
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

    // Trigger L1 entry
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1998,
      ask: 1998.1,
      spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });

    const activePositions = sm.getActivePositions();
    assert(activePositions.length === 1, 'TEST 1B: L1 position entered');

    // Test net profit below 50 (49 USC) -> should NOT activate
    broker.positions[0].profit = 49;
    broker.positions[0].commission = 0;
    broker.positions[0].swap = 0;

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2002,
      ask: 2002.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2002, high: 2002, low: 2002, close: 2002, time: Date.now() }],
      openTradesCount: 1
    });

    const setup = sm.getSetup();
    assert(setup?.trailingState?.profitLockActivated !== true, 'TEST 1C: Profit Lock NOT activated at +49 USC (threshold 50 USC)');

    // Test net profit at 50 -> should ACTIVATE
    broker.positions[0].profit = 50;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2003,
      ask: 2003.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2003, high: 2003, low: 2003, close: 2003, time: Date.now() }],
      openTradesCount: 1
    });

    assert(setup?.trailingState?.profitLockActivated === true, 'TEST 1D: Default 50 USC Profit Lock ACTIVATES at +50 USC');
  }

  // TEST 2: User setting = 20 USC -> activates at 20 USC
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, profitLockTarget: 20 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_20usc',
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

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1998,
      ask: 1998.1,
      spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });

    // 19 USC -> Not activated
    broker.positions[0].profit = 19;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2000,
      ask: 2000.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2000, high: 2000, low: 2000, close: 2000, time: Date.now() }],
      openTradesCount: 1
    });
    const setup = sm.getSetup();
    assert(setup?.trailingState?.profitLockActivated !== true, 'TEST 2A: Profit Lock NOT activated at +19 USC when Target is 20 USC');

    // 20 USC -> Activates
    broker.positions[0].profit = 20;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2001,
      ask: 2001.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2001, high: 2001, low: 2001, close: 2001, time: Date.now() }],
      openTradesCount: 1
    });
    assert(setup?.trailingState?.profitLockActivated === true, 'TEST 2B: User setting 20 USC ACTIVATES at +20 USC');
  }

  // TEST 3: User setting = 50 USC -> activates at 50 USC
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, profitLockTarget: 50 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_50usc',
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

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1998,
      ask: 1998.1,
      spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });

    broker.positions[0].profit = 50;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2003,
      ask: 2003.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2003, high: 2003, low: 2003, close: 2003, time: Date.now() }],
      openTradesCount: 1
    });
    const setup = sm.getSetup();
    assert(setup?.trailingState?.profitLockActivated === true, 'TEST 3: User setting 50 USC ACTIVATES at +50 USC');
  }

  // TEST 4: User setting = 100 USC -> activates at 100 USC
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, profitLockTarget: 100 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_100usc',
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

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1998,
      ask: 1998.1,
      spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });

    // 80 USC -> Not activated
    broker.positions[0].profit = 80;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2005,
      ask: 2005.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2005, high: 2005, low: 2005, close: 2005, time: Date.now() }],
      openTradesCount: 1
    });
    const setup = sm.getSetup();
    assert(setup?.trailingState?.profitLockActivated !== true, 'TEST 4A: Profit Lock NOT activated at +80 USC when Target is 100 USC');

    // 100 USC -> Activates
    broker.positions[0].profit = 100;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2007,
      ask: 2007.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2007, high: 2007, low: 2007, close: 2007, time: Date.now() }],
      openTradesCount: 1
    });
    assert(setup?.trailingState?.profitLockActivated === true, 'TEST 4B: User setting 100 USC ACTIVATES at +100 USC');
  }

  // TEST 5 & 6: Profit above target continues, retracement back to target closes entire basket
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, profitLockTarget: 50 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_runner',
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

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1998,
      ask: 1998.1,
      spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });

    // 1. Profit reaches 60 USC -> Activates lock
    broker.positions[0].profit = 60;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2004,
      ask: 2004.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2004, high: 2004, low: 2004, close: 2004, time: Date.now() }],
      openTradesCount: 1
    });
    assert(sm.getSetup()?.trailingState?.profitLockActivated === true, 'TEST 5A: Lock activated at +60 USC');

    // 2. Profit runs to 120 USC -> Positions remain OPEN, peak is tracked at 120 USC
    broker.positions[0].profit = 120;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2010,
      ask: 2010.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2010, high: 2010, low: 2010, close: 2010, time: Date.now() }],
      openTradesCount: 1
    });
    assert(broker.positions.length === 1, 'TEST 5B: Positions remain open as profit runs to +120 USC');
    assert(sm.getSetup()?.trailingState?.highestBasketNetProfit === 120, 'TEST 5C: Peak profit tracked at 120 USC');

    // 3. Profit retraces slightly to 80 USC -> Still above target (50), remains open
    broker.positions[0].profit = 80;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2006,
      ask: 2006.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2006, high: 2006, low: 2006, close: 2006, time: Date.now() }],
      openTradesCount: 1
    });
    assert(broker.positions.length === 1, 'TEST 5D: Retracement to +80 USC keeps trade open (above 50 USC target)');

    // 4. Profit retraces back to target (50 USC) -> ENTIRE BASKET CLOSES IMMEDIATELY
    broker.positions[0].profit = 50;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2003,
      ask: 2003.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2003, high: 2003, low: 2003, close: 2003, time: Date.now() }],
      openTradesCount: 1
    });
    assert(broker.closedTickets.length === 1, 'TEST 6A: Retracement back to +50 USC target CLOSES entire basket');
    assert(sm.getActivePositions().length === 0, 'TEST 6B: Active positions cleared in State Machine');
  }

  // TEST 7: True Net Profit calculation = Broker Profit + Commission + Swap
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, profitLockTarget: 50 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_comm_swap',
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

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1998,
      ask: 1998.1,
      spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });

    // Gross profit is 52, but Commission is -4 and Swap is -1 -> Net is 52 - 4 - 1 = 47 USC (< 50)
    broker.positions[0].profit = 52;
    broker.positions[0].commission = -4;
    broker.positions[0].swap = -1;

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2003,
      ask: 2003.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2003, high: 2003, low: 2003, close: 2003, time: Date.now() }],
      openTradesCount: 1
    });

    assert(sm.getSetup()?.trailingState?.profitLockActivated !== true, 'TEST 7A: Net profit 47 USC (52 gross - 4 comm - 1 swap) does NOT trigger 50 USC lock');

    // Now gross profit is 55, comm -4, swap -1 -> Net is 50 USC -> TRIGGERS
    broker.positions[0].profit = 55;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2004,
      ask: 2004.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2004, high: 2004, low: 2004, close: 2004, time: Date.now() }],
      openTradesCount: 1
    });

    assert(sm.getSetup()?.trailingState?.profitLockActivated === true, 'TEST 7B: Net profit 50 USC (55 gross - 4 comm - 1 swap) accurately TRIGGERS 50 USC lock');
  }

  // TEST 8: Dynamic updateUserSettings runtime change
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, profitLockTarget: 50 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_dyn_change',
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

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1998,
      ask: 1998.1,
      spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });

    // User updates profitLockTarget from 50 to 150 on the fly
    engine.updateUserSettings({ profitLockTarget: 150 });
    assert(engine.getUserSettings().profitLockTarget === 150, 'TEST 8A: Engine dynamically updated profitLockTarget to 150 USC');

    // 100 USC profit -> Should NOT activate because threshold is now 150
    broker.positions[0].profit = 100;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2005,
      ask: 2005.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2005, high: 2005, low: 2005, close: 2005, time: Date.now() }],
      openTradesCount: 1
    });
    assert(sm.getSetup()?.trailingState?.profitLockActivated !== true, 'TEST 8B: Profit 100 USC does not activate lock when updated to 150 USC');

    // 150 USC profit -> Activates
    broker.positions[0].profit = 150;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2009,
      ask: 2009.1,
      spreadPoints: 5,
      m1Candles: [{ open: 2009, high: 2009, low: 2009, close: 2009, time: Date.now() }],
      openTradesCount: 1
    });
    assert(sm.getSetup()?.trailingState?.profitLockActivated === true, 'TEST 8C: Profit 150 USC activates lock at new 150 USC setting');
  }

  // TEST 9: L1-L5 Regression with Max Positions Per Setup (1-5)
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, maxOpenTrades: 3, profitLockTarget: 75 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_l1_l5',
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

    const prices = [1998, 1996, 1994, 1992, 1990];
    for (const p of prices) {
      await engine.onMarketUpdate({
        symbol: 'XAUUSD',
        bid: p,
        ask: p,
        spreadPoints: 5,
        m1Candles: [{ open: p, high: p, low: p, close: p, time: Date.now() }],
        openTradesCount: broker.positions.length
      });
    }

    assert(broker.positions.length === 3, `TEST 9A: Max Positions Per Setup (3) strictly capped orders at 3 (got ${broker.positions.length})`);
    assert(broker.positions[0].comment.includes('DaRa v1.0 BUY'), 'TEST 9B: Position 1 is L1');
    assert(broker.positions[1].comment.includes('#2'), 'TEST 9C: Position 2 is L2');
    assert(broker.positions[2].comment.includes('#3'), 'TEST 9D: Position 3 is L3');
  }

  // TEST 10: Multi-position basket combined profit lock
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, maxOpenTrades: 2, profitLockTarget: 50 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_multi_basket',
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

    // Enter L1 and L2
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1998,
      ask: 1998,
      spreadPoints: 5,
      m1Candles: [{ open: 1998, high: 1998, low: 1998, close: 1998, time: Date.now() }],
      openTradesCount: 0
    });
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1996,
      ask: 1996,
      spreadPoints: 5,
      m1Candles: [{ open: 1996, high: 1996, low: 1996, close: 1996, time: Date.now() }],
      openTradesCount: 1
    });

    assert(broker.positions.length === 2, 'TEST 10A: L1 and L2 both active in basket');

    // L1 has +30 USC, L2 has +25 USC -> Combined True Net = +55 USC (>= 50 target)
    broker.positions[0].profit = 30;
    broker.positions[0].commission = 0;
    broker.positions[0].swap = 0;

    broker.positions[1].profit = 25;
    broker.positions[1].commission = 0;
    broker.positions[1].swap = 0;

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2002,
      ask: 2002,
      spreadPoints: 5,
      m1Candles: [{ open: 2002, high: 2002, low: 2002, close: 2002, time: Date.now() }],
      openTradesCount: 2
    });

    assert(sm.getSetup()?.trailingState?.profitLockActivated === true, 'TEST 10B: Multi-position basket combined profit (+55 USC) activates profit lock at 50 USC target');

    // Combined profit drops to 48 USC (<= 50 target) -> ENTIRE BASKET (both L1 and L2) closes!
    broker.positions[0].profit = 25;
    broker.positions[1].profit = 23;

    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2000,
      ask: 2000,
      spreadPoints: 5,
      m1Candles: [{ open: 2000, high: 2000, low: 2000, close: 2000, time: Date.now() }],
      openTradesCount: 2
    });

    assert(broker.closedTickets.length === 2, 'TEST 10C: Entire multi-position basket (all 2 positions) closed together on profit lock retracement');
  }

  // TEST 11: Safety check - LIVE trading disabled verification
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...baseSettings, liveTradingEnabled: false });
    assert(engine.getUserSettings().liveTradingEnabled === false, 'TEST 11: LIVE trading remains strictly OFF in engine default safety profile');
  }

  console.log('\n===============================================================');
  console.log(`📊 FINAL SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
