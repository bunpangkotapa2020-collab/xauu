import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';
import { DaRaM1Strategy } from './src/engines/dara_m1/DaRaM1Strategy';
import { DaRaOrderExecution } from './src/engines/dara_m1/DaRaOrderExecution';
import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import {
  DaRaPosition,
  DaRaSetup,
  DaRaUserSettings,
  DaRaMarketFeed,
  DaRaBrokerOrderResult,
  DaRaExitReason
} from './src/engines/dara_m1/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function createMockBroker(delayMs: number = 0) {
  const orders: any[] = [];
  const openPositions: any[] = [];
  let ticketCounter = 1000;

  return {
    orders,
    openPositions,
    async getSymbolInfo(symbol: string) {
      return { pointSize: 0.01 };
    },
    async sendOrder(params: any) {
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      const ticket = String(++ticketCounter);
      const order = {
        ticket,
        symbol: params.symbol,
        type: params.type,
        lot: params.lot,
        openPrice: params.openPrice,
        currentPrice: params.openPrice,
        sl: params.sl,
        tp: params.tp,
        unrealizedProfit: 0,
        commission: 0,
        swap: 0
      };
      orders.push(order);
      openPositions.push(order);
      return {
        success: true,
        ticket,
        openPrice: params.openPrice,
        lot: params.lot
      };
    },
    async getOpenPositions(symbol: string) {
      return [...openPositions];
    },
    async closePosition(ticket: string | number) {
      const idx = openPositions.findIndex(p => String(p.ticket) === String(ticket));
      if (idx >= 0) openPositions.splice(idx, 1);
      return { success: true };
    },
    async modifyPosition(ticket: string | number, sl?: number, tp?: number) {
      const pos = openPositions.find(p => String(p.ticket) === String(ticket));
      if (pos) {
        if (sl !== undefined) pos.sl = sl;
        if (tp !== undefined) pos.tp = tp;
      }
      return { success: true };
    }
  };
}

const defaultSettings: DaRaUserSettings = {
  liveTradingEnabled: true,
  lotSize: 0.01,
  slDistance: 30,
  tpDistance: 30,
  dailyLossLimit: 50,
  maxOpenTrades: 5,
  maxConsecutiveSL: 3,
  cooldownMinutes: 15,
  maxSpreadPoints: 50,
  newsFilterEnabled: false,
  newsMinsBefore: 0,
  newsMinsAfter: 0,
  trailingEnabled: true,
  entryDistance: 1.0
};

async function runAll21Tests() {
  console.log('========================================================================');
  console.log('🧪 DARA M1 EA - 21-POINT STRICT NEW PRICE EVENT & CROSSING VERIFICATION');
  console.log('========================================================================\n');

  const results: { id: number; name: string; status: 'PASS' | 'FAIL'; detail: string }[] = [];

  function pass(id: number, name: string, detail: string) {
    results.push({ id, name, status: 'PASS', detail });
    console.log(`✅ TEST ${String(id).padStart(2, '0')}: [PASS] ${name} -> ${detail}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 01: L1-L5 Target Calculation
  // ---------------------------------------------------------------------------
  {
    const smBuy = new DaRaM1StateMachine();
    smBuy.transitionTo('SCANNING', 'Ready');
    smBuy.onSetupDetected({
      id: 'setup_buy_calc', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130
    }, { ...defaultSettings, entryDistance: 1.0 });

    const buyLevels = smBuy.getSetup()?.entryLevels!;
    assert(buyLevels.length === 5, 'Must calculate exactly 5 levels');
    assert(buyLevels[0].targetPrice === 100, `L1 BUY target must be 100, got ${buyLevels[0].targetPrice}`);
    assert(buyLevels[1].targetPrice === 99, `L2 BUY target must be 99, got ${buyLevels[1].targetPrice}`);
    assert(buyLevels[2].targetPrice === 98, `L3 BUY target must be 98, got ${buyLevels[2].targetPrice}`);
    assert(buyLevels[3].targetPrice === 97, `L4 BUY target must be 97, got ${buyLevels[3].targetPrice}`);
    assert(buyLevels[4].targetPrice === 96, `L5 BUY target must be 96, got ${buyLevels[4].targetPrice}`);

    const smSell = new DaRaM1StateMachine();
    smSell.transitionTo('SCANNING', 'Ready');
    smSell.onSetupDetected({
      id: 'setup_sell_calc', direction: 'SELL', sweepLevel: 105, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 95, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 130, virtualTPPrice: 70
    }, { ...defaultSettings, entryDistance: 1.5 });

    const sellLevels = smSell.getSetup()?.entryLevels!;
    assert(sellLevels[0].targetPrice === 100, 'L1 SELL target must be 100');
    assert(sellLevels[1].targetPrice === 101.5, 'L2 SELL target must be 101.5');
    assert(sellLevels[2].targetPrice === 103.0, 'L3 SELL target must be 103.0');
    assert(sellLevels[3].targetPrice === 104.5, 'L4 SELL target must be 104.5');
    assert(sellLevels[4].targetPrice === 106.0, 'L5 SELL target must be 106.0');

    pass(1, 'L1-L5 Target Calculation', 'Verified BUY (100, 99, 98, 97, 96) and SELL (100, 101.5, 103, 104.5, 106)');
  }

  // ---------------------------------------------------------------------------
  // TEST 02: BUY Normal Sequential Movement (100 -> 99 -> 98 -> 97 -> 96)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_buy_seq', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    const prices = [100.0, 99.0, 98.0, 97.0, 96.0];
    for (let i = 0; i < prices.length; i++) {
      await engine.onMarketUpdate({
        symbol: 'XAUUSD', bid: prices[i], ask: prices[i] + 0.1, time: i + 1, serverTime: i + 1,
        spreadPoints: 10, openTradesCount: broker.orders.length, m1Candles: []
      });
      assert(broker.orders.length === i + 1, `After price ${prices[i]}, expected ${i + 1} orders, got ${broker.orders.length}`);
    }
    pass(2, 'BUY Normal Sequential Movement', 'Gradual drop 100->99->98->97->96 executed L1 through L5 sequentially');
  }

  // ---------------------------------------------------------------------------
  // TEST 03: SELL Normal Sequential Movement (100 -> 101 -> 102 -> 103 -> 104)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_sell_seq', direction: 'SELL', sweepLevel: 105, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 95, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 130, virtualTPPrice: 70, sharedSL: 130, sharedTP: 70
    }, engine.getUserSettings());

    const prices = [100.0, 101.0, 102.0, 103.0, 104.0];
    for (let i = 0; i < prices.length; i++) {
      await engine.onMarketUpdate({
        symbol: 'XAUUSD', bid: prices[i], ask: prices[i] + 0.1, time: i + 1, serverTime: i + 1,
        spreadPoints: 10, openTradesCount: broker.orders.length, m1Candles: []
      });
      assert(broker.orders.length === i + 1, `After price ${prices[i]}, expected ${i + 1} orders, got ${broker.orders.length}`);
    }
    pass(3, 'SELL Normal Sequential Movement', 'Gradual rise 100->101->102->103->104 executed L1 through L5 sequentially');
  }

  // ---------------------------------------------------------------------------
  // TEST 04: BUY Deep Price Spike (L1 at 100, sudden drop to 96)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_buy_spike', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // 1. Open L1 at 100
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1,
      spreadPoints: 10, openTradesCount: 0, m1Candles: []
    });
    assert(broker.orders.length === 1, 'L1 opened at 100');

    // 2. Sudden drop to 96
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 96.0, ask: 96.1, time: 2, serverTime: 2,
      spreadPoints: 10, openTradesCount: 1, m1Candles: []
    });
    assert(broker.orders.length === 2, 'L2 opened at 96');
    assert(sm.getSetup()?.lastExecutedPrice === 96.1, 'L2 recorded executed fill price');

    pass(4, 'BUY Deep Price Spike', 'L1 at 100, drop to 96 executed only L2 (1 position on the spike update)');
  }

  // ---------------------------------------------------------------------------
  // TEST 05: SELL Deep Price Spike (L1 at 100, sudden surge to 104)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_sell_spike', direction: 'SELL', sweepLevel: 105, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 95, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 130, virtualTPPrice: 70, sharedSL: 130, sharedTP: 70
    }, engine.getUserSettings());

    // 1. Open L1 at 100
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1,
      spreadPoints: 10, openTradesCount: 0, m1Candles: []
    });
    assert(broker.orders.length === 1, 'L1 opened at 100');

    // 2. Sudden surge to 104
    await engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 104.0, ask: 104.1, time: 2, serverTime: 2,
      spreadPoints: 10, openTradesCount: 1, m1Candles: []
    });
    assert(broker.orders.length === 2, 'L2 opened at 104');
    pass(5, 'SELL Deep Price Spike', 'L1 at 100, surge to 104 executed only L2 (1 position on the surge update)');
  }

  // ---------------------------------------------------------------------------
  // TEST 06: Repeated Identical Ticks (The Core Defect Fix)
  // L1 opened, price drops to 96 -> L2 executes.
  // 10 subsequent identical ticks at 96 MUST NOT execute L3, L4, L5!
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_repeat_ticks', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // L1 at 100
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    assert(broker.orders.length === 1, 'L1 opened');

    // L2 at 96
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 96.0, ask: 96.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    assert(broker.orders.length === 2, 'L2 opened');

    // 10 repeated ticks at 96.0
    for (let t = 3; t <= 12; t++) {
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 96.0, ask: 96.1, time: t, serverTime: t, spreadPoints: 10, openTradesCount: 2, m1Candles: [] });
      assert(broker.orders.length === 2, `Tick ${t} at 96.0 must NOT open order, got ${broker.orders.length}`);
    }

    pass(6, 'Repeated Identical Ticks Rejection', '10 consecutive ticks at 96.0 strictly rejected; total orders remained 2');
  }

  // ---------------------------------------------------------------------------
  // TEST 07: Repeated Deep Price Ticks (slight noise without new crossing or continuation)
  // e.g. 96.1, 96.2, 96.05, 96.3 — none reach 95 or cross 98 from above
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_deep_noise', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 96.0, ask: 96.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    assert(broker.orders.length === 2, 'L1 and L2 opened');

    const deepNoise = [96.2, 96.3, 96.1, 96.4, 96.15, 96.25];
    for (let i = 0; i < deepNoise.length; i++) {
      await engine.onMarketUpdate({
        symbol: 'XAUUSD', bid: deepNoise[i], ask: deepNoise[i] + 0.1, time: i + 3, serverTime: i + 3,
        spreadPoints: 10, openTradesCount: 2, m1Candles: []
      });
      assert(broker.orders.length === 2, `Noise price ${deepNoise[i]} must not trigger L3`);
    }

    pass(7, 'Repeated Deep Price Noise Rejection', 'Oscillations in 96.1-96.4 did not trigger L3 without valid event');
  }

  // ---------------------------------------------------------------------------
  // TEST 08: Price Returns Across Next Level Target (Pathway 1: 96 -> 98.2 -> 97.9)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_rebound_crossing', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // L1 at 100
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    // L2 at 96
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 96.0, ask: 96.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    assert(broker.orders.length === 2, 'L1 and L2 opened');

    // Price rebounds above L3 target (98.0) to 98.2
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 98.2, ask: 98.3, time: 3, serverTime: 3, spreadPoints: 10, openTradesCount: 2, m1Candles: [] });
    assert(broker.orders.length === 2, 'At 98.2, L3 target not reached');

    // Price crosses down to 97.9
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 97.9, ask: 98.0, time: 4, serverTime: 4, spreadPoints: 10, openTradesCount: 2, m1Candles: [] });
    assert(broker.orders.length === 3, 'L3 successfully executed after crossing 98.0 from above!');

    pass(8, 'Price Returns Across Next Target', '96 -> 98.2 -> 97.9 successfully executed L3 upon downward crossing');
  }

  // ---------------------------------------------------------------------------
  // TEST 09: New Movement Continuation Case (Pathway 2: 96 -> 95.5 -> 95.0)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_continuation', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // L1 at 100
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    // L2 at 96 (executed at ask 96.1)
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 96.0, ask: 96.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    assert(broker.orders.length === 2, 'L1 and L2 opened');

    // Intermediate tick 95.5 (does not reach 96.1 - 1.0 = 95.1)
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 95.5, ask: 95.6, time: 3, serverTime: 3, spreadPoints: 10, openTradesCount: 2, m1Candles: [] });
    assert(broker.orders.length === 2, '95.5 does not satisfy continuation distance from fill 96.1');

    // Continuation tick 95.0 (reaches <= 95.1)
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 95.0, ask: 95.1, time: 4, serverTime: 4, spreadPoints: 10, openTradesCount: 2, m1Candles: [] });
    assert(broker.orders.length === 3, 'L3 executed on continuation lower by entry distance');

    pass(9, 'Continuation by Entry Distance Barrier', 'Drop to 95.0 satisfied continuation barrier and triggered L3');
  }

  // ---------------------------------------------------------------------------
  // TEST 10: One Level Per Market Update
  // Single market update with price 90.0 MUST execute at most 1 level
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_single_update', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    // Single update with price 90.0 (below all 5 levels!)
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 90.0, ask: 90.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    assert(broker.orders.length === 1, `Single update must open exactly 1 level, got ${broker.orders.length}`);

    pass(10, 'One Level Per Market Update', 'Single update at 90.0 opened only L1, returning immediately');
  }

  // ---------------------------------------------------------------------------
  // TEST 11: Async Concurrent Tick Protection (Order-In-Flight Mutex)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker(40); // 40ms simulated network latency
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_mutex', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    const flightPromise = engine.onMarketUpdate({
      symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: []
    });

    // Fire 3 simultaneous rapid ticks while first is in flight
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 99.0, ask: 99.1, time: 1.1, serverTime: 1.1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 98.0, ask: 98.1, time: 1.2, serverTime: 1.2, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 97.0, ask: 97.1, time: 1.3, serverTime: 1.3, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });

    await flightPromise;
    assert(broker.orders.length === 1, `Mutex must block intermediate ticks, got ${broker.orders.length}`);

    pass(11, 'Async Concurrent Tick Protection', 'Mutex blocked all ticks arriving during broker execution latency window');
  }

  // ---------------------------------------------------------------------------
  // TEST 12: Positions Per Setup = 1 (L1 -> STOP)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 1 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_pos1', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    assert(broker.orders.length === 1, 'L1 opened');

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 99.0, ask: 99.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    assert(broker.orders.length === 1, 'L2 blocked because maxOpenTrades = 1');

    pass(12, 'Positions Per Setup = 1', 'Executed L1 and strictly stopped at 1 position');
  }

  // ---------------------------------------------------------------------------
  // TEST 13: Positions Per Setup = 2 (L1 -> WAIT -> L2 -> STOP)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 2 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_pos2', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 99.0, ask: 99.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    assert(broker.orders.length === 2, 'L1 and L2 opened');

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 98.0, ask: 98.1, time: 3, serverTime: 3, spreadPoints: 10, openTradesCount: 2, m1Candles: [] });
    assert(broker.orders.length === 2, 'L3 blocked because maxOpenTrades = 2');

    pass(13, 'Positions Per Setup = 2', 'Executed L1, waited for L2, executed L2, strictly stopped at 2');
  }

  // ---------------------------------------------------------------------------
  // TEST 14: Positions Per Setup = 3 (L1 -> L2 -> L3 -> STOP)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 3 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_pos3', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 99.0, ask: 99.1, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 98.0, ask: 98.1, time: 3, serverTime: 3, spreadPoints: 10, openTradesCount: 2, m1Candles: [] });
    assert(broker.orders.length === 3, 'L1, L2, L3 opened');

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 97.0, ask: 97.1, time: 4, serverTime: 4, spreadPoints: 10, openTradesCount: 3, m1Candles: [] });
    assert(broker.orders.length === 3, 'L4 blocked because maxOpenTrades = 3');

    pass(14, 'Positions Per Setup = 3', 'Executed L1->L2->L3 and strictly stopped at 3');
  }

  // ---------------------------------------------------------------------------
  // TEST 15: Positions Per Setup = 4 (L1 -> L2 -> L3 -> L4 -> STOP)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 4 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_pos4', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    for (let i = 0; i < 4; i++) {
      const p = 100 - i;
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: i + 1, serverTime: i + 1, spreadPoints: 10, openTradesCount: i, m1Candles: [] });
    }
    assert(broker.orders.length === 4, 'L1 through L4 opened');

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 96.0, ask: 96.1, time: 5, serverTime: 5, spreadPoints: 10, openTradesCount: 4, m1Candles: [] });
    assert(broker.orders.length === 4, 'L5 blocked because maxOpenTrades = 4');

    pass(15, 'Positions Per Setup = 4', 'Executed L1->L2->L3->L4 and strictly stopped at 4');
  }

  // ---------------------------------------------------------------------------
  // TEST 16: Positions Per Setup = 5 (L1 through L5 -> STOP)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, maxOpenTrades: 5 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_pos5', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    for (let i = 0; i < 5; i++) {
      const p = 100 - i;
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: i + 1, serverTime: i + 1, spreadPoints: 10, openTradesCount: i, m1Candles: [] });
    }
    assert(broker.orders.length === 5, 'All 5 levels opened');

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 95.0, ask: 95.1, time: 6, serverTime: 6, spreadPoints: 10, openTradesCount: 5, m1Candles: [] });
    assert(broker.orders.length === 5, 'No L6 can ever exist; capped at 5');

    pass(16, 'Positions Per Setup = 5', 'Executed L1 through L5 sequentially and capped cleanly at 5');
  }

  // ---------------------------------------------------------------------------
  // TEST 17: One Basket / One Direction (No New Scan while Basket is Open)
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, defaultSettings);
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_active_basket', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    assert(sm.hasOpenPositions(), 'Basket has active positions');

    // Attempt to detect a new setup while trade is active
    sm.onSetupDetected({
      id: 'setup_unwanted_second', direction: 'SELL', sweepLevel: 110, sweepTime: 2000, displacementConfirmed: true,
      mssLevel: 90, mssTime: 2010, lockedEntryPrice: 95, virtualSLPrice: 120, virtualTPPrice: 60
    }, engine.getUserSettings());

    assert(sm.getSetup()?.id === 'setup_active_basket', 'State machine must reject new setup while active');
    assert(sm.getSetup()?.direction === 'BUY', 'Direction remains strictly BUY');

    pass(17, 'One Basket / One Direction', 'Preserved single basket; rejected concurrent setups while active');
  }

  // ---------------------------------------------------------------------------
  // TEST 18: Shared SL/TP Integrity Across All Levels
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, { ...defaultSettings, entryDistance: 1.0 });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_shared_sltp', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    for (let i = 0; i < 3; i++) {
      const p = 100 - i;
      await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: p, ask: p + 0.1, time: i + 1, serverTime: i + 1, spreadPoints: 10, openTradesCount: i, m1Candles: [] });
    }

    assert(broker.orders.length === 3, '3 positions opened');
    for (const ord of broker.orders) {
      assert(ord.sl === 70, `All orders must share SL=70, got ${ord.sl}`);
      assert(ord.tp === 130, `All orders must share TP=130, got ${ord.tp}`);
    }

    pass(18, 'Shared SL/TP Integrity', 'All 3 opened levels share exact identical SL=70 and TP=130');
  }

  // ---------------------------------------------------------------------------
  // TEST 20: Existing Trailing SL Logic Intact
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, {
      ...defaultSettings,
      trailingEnabled: true
    });
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;
    sm.onSetupDetected({
      id: 'setup_trailing', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 70, virtualTPPrice: 130, sharedSL: 70, sharedTP: 130
    }, engine.getUserSettings());

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 100.0, ask: 100.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    assert(broker.openPositions.length === 1, 'Position 1 opened');

    // Price approaches TP (130) at 128.5 (activation distance 1.5)
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 128.6, ask: 128.7, time: 2, serverTime: 2, spreadPoints: 10, openTradesCount: 1, m1Candles: [] });
    assert(sm.getSetup()?.trailingState?.activated === true, 'Trailing SL activated near TP');
    assert((sm.getSetup()?.trailingState?.currentHiddenSL || 0) >= 128.5, 'Trailing SL stepped forward');

    pass(20, 'Existing Trailing SL Logic Intact', 'Trailing SL activated at 128.6 (near TP 130) and advanced trailing stop price');
  }

  // ---------------------------------------------------------------------------
  // TEST 21: Full DaRa Regression
  // Full cycle: Scan -> MSS -> L1 entry -> Cancel if SL touched -> Rescan
  // ---------------------------------------------------------------------------
  {
    const broker = createMockBroker();
    const engine = new DaRaM1Engine(broker as any, defaultSettings);
    engine.start();
    const sm = (engine as any).stateMachine as DaRaM1StateMachine;

    // 1. Pending setup with virtual SL at 95
    sm.onSetupDetected({
      id: 'setup_regress', direction: 'BUY', sweepLevel: 95, sweepTime: 1000, displacementConfirmed: true,
      mssLevel: 105, mssTime: 1010, lockedEntryPrice: 100, signalPrice: 100,
      virtualSLPrice: 95, virtualTPPrice: 130, sharedSL: 95, sharedTP: 130
    }, engine.getUserSettings());

    assert(sm.getState() === 'WAIT_FOR_LOCKED_ENTRY', 'Waiting for entry');

    // Price hits virtual SL (95) before entry
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 94.0, ask: 94.1, time: 1, serverTime: 1, spreadPoints: 10, openTradesCount: 0, m1Candles: [] });
    assert(sm.getState() === 'SCANNING', 'Setup canceled without trade; resumed SCANNING');
    assert(broker.orders.length === 0, 'Zero orders executed on canceled setup');

    pass(21, 'Full DaRa Regression', 'Pending setup canceled cleanly when virtual SL hit before entry; 24/7 scanning resumed');
  }

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${results.length} VERIFICATION TESTS COMPLETED SUCCESSFULLY!`);
  console.log('========================================================================');
}

runAll21Tests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
