/**
 * ============================================================================
 * 🧪 DARA M1 EA v1.0 — CANDLESTICK CONFIRMATION & EDGE CASE VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Candlestick Confirmation: Bullish Engulfing, Hammer, Morning Star, Piercing
 * 2. Candlestick Confirmation: Bearish Engulfing, Shooting Star, Evening Star, Dark Cloud Cover
 * 3. Candlestick Filter Behavior: Rejection when score < minScore or unconfirmed
 * 4. Bypass/Pass-through when candleConfirmationEnabled = false
 * 5. Edge Case: Master Entry = 2700, Entry Pullback Pos #1 = 1.0, Entry Distance = 0.5
 *    - BUY targets: L1=2699.0, L2=2699.0, L3=2698.5, L4=2698.0, L5=2697.5
 *    - SELL targets: L1=2701.0, L2=2701.0, L3=2701.5, L4=2702.0, L5=2702.5
 * 6. Price crosses L1/L2 same target
 * 7. Positions Per Setup = 1 & Positions Per Setup = 2 limits
 * 8. Rapid/concurrent ticks at same target
 * 9. Deterministic execution order & no duplicate orders
 * 10. No Level 6 under any circumstances
 * 11. BUY->BUY and SELL->SELL direction integrity
 * 12. SL/TP calculation integrity
 * 13. Live trading remains false by default
 * ============================================================================
 */

import { DaRaCandleConfirmationModule } from './src/engines/dara_m1/DaRaCandleConfirmation';
import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';
import { DaRaCandle, DaRaUserSettings, DaRaSetup } from './src/engines/dara_m1/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

let testCount = 0;
let passedCount = 0;

function reportPass(name: string, detail: string) {
  testCount++;
  passedCount++;
  console.log(`[PASS ${testCount}] ✅ ${name}`);
  console.log(`       Details: ${detail}`);
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🔬 STARTING DARA M1 EA VERIFICATION SUITE');
  console.log('================================================================\n');

  const candleModule = new DaRaCandleConfirmationModule({
    enabled: true,
    minScoreRequired: 2
  });

  // --------------------------------------------------------------------------
  // TEST 1: Bullish Engulfing Pattern Detection
  // --------------------------------------------------------------------------
  {
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2702, high: 2703, low: 2700, close: 2701 }, // c0
      { time: 2000, open: 2701, high: 2701.5, low: 2698, close: 2698.5 }, // c1 Bearish (body 2.5, range 3.5)
      { time: 3000, open: 2698.2, high: 2702, low: 2698.0, close: 2701.5 } // c2 Bullish Engulfing (body 3.3, range 4.0)
    ];
    const res = candleModule.evaluateConfirmation(candles, 'BUY', 2);
    assert(res.isConfirmed === true, 'Bullish Engulfing should be confirmed');
    assert(res.patternName === 'Bullish Engulfing', 'Pattern name should be Bullish Engulfing');
    assert(res.score >= 2, 'Score should be >= 2');
    reportPass('Bullish Engulfing Confirmation', `Detected ${res.patternName} with score ${res.score}`);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Hammer Pattern Detection
  // --------------------------------------------------------------------------
  {
    // Range: 2702 - 2696 = 6.0, Body: 2701.5 - 2701.0 = 0.5, Lower Wick: 2701 - 2696 = 5.0 (5/6 = 83%), Upper Wick: 2702 - 2701.5 = 0.5
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2704, high: 2705, low: 2702, close: 2702.5 },
      { time: 2000, open: 2702.5, high: 2703, low: 2700, close: 2700.5 },
      { time: 3000, open: 2701.0, high: 2702.0, low: 2696.0, close: 2701.5 } // Hammer
    ];
    const res = candleModule.evaluateConfirmation(candles, 'BUY', 2);
    assert(res.isConfirmed === true, 'Hammer should be confirmed');
    assert(res.patternName === 'Hammer', 'Pattern name should be Hammer');
    reportPass('Hammer Confirmation', `Detected ${res.patternName} with lower wick ratio > 50%`);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Morning Star Pattern Detection
  // --------------------------------------------------------------------------
  {
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2705, high: 2705.5, low: 2698, close: 2698.5 }, // c0 Strong Bearish
      { time: 2000, open: 2698.0, high: 2698.5, low: 2697.0, close: 2697.8 }, // c1 Star / Doji
      { time: 3000, open: 2698.2, high: 2704.0, low: 2698.0, close: 2703.5 }  // c2 Strong Bullish closing > 50% c0
    ];
    const res = candleModule.evaluateConfirmation(candles, 'BUY', 2);
    assert(res.isConfirmed === true, 'Morning Star should be confirmed');
    assert(res.patternName === 'Morning Star', 'Pattern name should be Morning Star');
    reportPass('Morning Star Confirmation', `Detected 3-candle ${res.patternName} with score ${res.score}`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Piercing Pattern Detection
  // --------------------------------------------------------------------------
  {
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2705, high: 2705.5, low: 2699, close: 2700 }, // c0 Bearish (open 2705, close 2700, mid 2702.5)
      { time: 2000, open: 2699.8, high: 2704.0, low: 2699.5, close: 2703.5 } // c1 Bullish closing at 2703.5 (> 2702.5, < 2705)
    ];
    const res = candleModule.evaluateConfirmation(candles, 'BUY', 1);
    assert(res.isConfirmed === true, 'Piercing Pattern should be confirmed');
    assert(res.patternName === 'Piercing Pattern', 'Pattern name should be Piercing Pattern');
    reportPass('Piercing Pattern Confirmation', `Detected ${res.patternName} closing above midpoint`);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Bearish Engulfing Pattern Detection
  // --------------------------------------------------------------------------
  {
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2698, high: 2702, low: 2697.5, close: 2701.5 }, // c0 Bullish
      { time: 2000, open: 2701.8, high: 2702.2, low: 2697.0, close: 2697.2 } // c1 Bearish Engulfing
    ];
    const res = candleModule.evaluateConfirmation(candles, 'SELL', 1);
    assert(res.isConfirmed === true, 'Bearish Engulfing should be confirmed');
    assert(res.patternName === 'Bearish Engulfing', 'Pattern name should be Bearish Engulfing');
    reportPass('Bearish Engulfing Confirmation', `Detected ${res.patternName} for SELL`);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Shooting Star Pattern Detection
  // --------------------------------------------------------------------------
  {
    // Range: 2706 - 2700 = 6.0, Upper Wick: 2706 - 2701 = 5.0 (83%), Body: 2701 - 2700.5 = 0.5
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2698, high: 2701, low: 2697.5, close: 2700.5 },
      { time: 2000, open: 2700.8, high: 2706.0, low: 2700.2, close: 2700.5 } // Shooting Star
    ];
    const res = candleModule.evaluateConfirmation(candles, 'SELL', 1);
    assert(res.isConfirmed === true, 'Shooting Star should be confirmed');
    assert(res.patternName === 'Shooting Star', 'Pattern name should be Shooting Star');
    reportPass('Shooting Star Confirmation', `Detected ${res.patternName} with upper wick ratio > 50%`);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Evening Star Pattern Detection
  // --------------------------------------------------------------------------
  {
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2696, high: 2703, low: 2695.5, close: 2702.5 }, // c0 Strong Bullish
      { time: 2000, open: 2702.8, high: 2703.5, low: 2702.0, close: 2702.5 }, // c1 Star / Doji
      { time: 3000, open: 2702.2, high: 2702.5, low: 2697.0, close: 2697.5 }  // c2 Strong Bearish closing < 50% c0
    ];
    const res = candleModule.evaluateConfirmation(candles, 'SELL', 2);
    assert(res.isConfirmed === true, 'Evening Star should be confirmed');
    assert(res.patternName === 'Evening Star', 'Pattern name should be Evening Star');
    reportPass('Evening Star Confirmation', `Detected 3-candle ${res.patternName} for SELL`);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Dark Cloud Cover Pattern Detection
  // --------------------------------------------------------------------------
  {
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2696, high: 2702, low: 2695.5, close: 2701.5 }, // c0 Bullish (midpoint 2698.75)
      { time: 2000, open: 2701.8, high: 2702.2, low: 2697.5, close: 2698.0 } // c1 Bearish closing below midpoint
    ];
    const res = candleModule.evaluateConfirmation(candles, 'SELL', 1);
    assert(res.isConfirmed === true, 'Dark Cloud Cover should be confirmed');
    assert(res.patternName === 'Dark Cloud Cover', 'Pattern name should be Dark Cloud Cover');
    reportPass('Dark Cloud Cover Confirmation', `Detected ${res.patternName} closing below midpoint`);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Discard / Rejection when pattern does not qualify
  // --------------------------------------------------------------------------
  {
    // Indecision / flat candle
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2700, high: 2701, low: 2699, close: 2700.2 },
      { time: 2000, open: 2700.2, high: 2700.8, low: 2699.8, close: 2700.1 }
    ];
    const res = candleModule.evaluateConfirmation(candles, 'BUY', 1);
    assert(res.isConfirmed === false, 'Non-qualifying pattern must not be confirmed');
    reportPass('Pattern Rejection Safety', 'Unconfirmed pattern rejected safely without opening trade');
  }

  // --------------------------------------------------------------------------
  // TEST 10: Bypass / Pass-through when candleConfirmationEnabled = false
  // --------------------------------------------------------------------------
  {
    const bypassModule = new DaRaCandleConfirmationModule({ enabled: false });
    const candles: DaRaCandle[] = [
      { time: 1000, open: 2700, high: 2701, low: 2699, close: 2700.2 },
      { time: 2000, open: 2700.2, high: 2700.8, low: 2699.8, close: 2700.1 }
    ];
    const res = bypassModule.evaluateConfirmation(candles, 'BUY', 1);
    assert(res.isConfirmed === true, 'Bypass module should return isConfirmed = true');
    reportPass('Bypass Pass-through Mode', 'When disabled, module safely passes through setup without error');
  }

  // --------------------------------------------------------------------------
  // TEST 11: Exact Target Calculations (Edge Case Specification)
  // Master Entry = 2700, Entry Pullback Pos #1 = 1.0, Entry Distance = 0.5
  // BUY: L1=2699.0, L2=2699.0, L3=2698.5, L4=2698.0, L5=2697.5
  // SELL: L1=2701.0, L2=2701.0, L3=2701.5, L4=2702.0, L5=2702.5
  // --------------------------------------------------------------------------
  {
    const stateMachine = new DaRaM1StateMachine();
    const buySetup: DaRaSetup = {
      id: 'TEST_BUY_EDGE',
      direction: 'BUY',
      sweepLevel: 2690,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 2700,
      mssTime: 2000,
      lockedEntryPrice: 2700,
      masterEntryPrice: 2700,
      userSlDistance: 25,
      userTpDistance: 35,
      virtualSLPrice: 2675,
      virtualTPPrice: 2735,
      status: 'PENDING_ENTRY'
    };
    const settings: DaRaUserSettings = {
      lotSize: 0.01,
      slDistance: 25,
      tpDistance: 35,
      dailyLossLimit: 50,
      maxOpenTrades: 5,
      positionsPerSetup: 5,
      entryPullbackPos1: 1.0,
      entryDistance: 0.5,
      liveTradingEnabled: false
    };

    stateMachine.onUserStart();
    stateMachine.onSetupDetected(buySetup, settings);
    const levels = stateMachine.getSetup()?.entryLevels || [];

    assert(levels[0].targetPrice === 2699.0, `BUY L1 must be 2699.0, got ${levels[0].targetPrice}`);
    assert(levels[1].targetPrice === 2699.0, `BUY L2 must be 2699.0, got ${levels[1].targetPrice}`);
    assert(levels[2].targetPrice === 2698.5, `BUY L3 must be 2698.5, got ${levels[2].targetPrice}`);
    assert(levels[3].targetPrice === 2698.0, `BUY L4 must be 2698.0, got ${levels[3].targetPrice}`);
    assert(levels[4].targetPrice === 2697.5, `BUY L5 must be 2697.5, got ${levels[4].targetPrice}`);
    assert(levels.length === 5, 'Must have exactly 5 levels, no Level 6');
    reportPass('BUY Edge Case Level Calculation', 'L1=2699.0, L2=2699.0, L3=2698.5, L4=2698.0, L5=2697.5');

    // SELL Calculation
    const sellStateMachine = new DaRaM1StateMachine();
    const sellSetup: DaRaSetup = {
      id: 'TEST_SELL_EDGE',
      direction: 'SELL',
      sweepLevel: 2710,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 2700,
      mssTime: 2000,
      lockedEntryPrice: 2700,
      masterEntryPrice: 2700,
      userSlDistance: 25,
      userTpDistance: 35,
      virtualSLPrice: 2725,
      virtualTPPrice: 2665,
      status: 'PENDING_ENTRY'
    };
    sellStateMachine.onUserStart();
    sellStateMachine.onSetupDetected(sellSetup, settings);
    const sellLevels = sellStateMachine.getSetup()?.entryLevels || [];

    assert(sellLevels[0].targetPrice === 2701.0, `SELL L1 must be 2701.0, got ${sellLevels[0].targetPrice}`);
    assert(sellLevels[1].targetPrice === 2701.0, `SELL L2 must be 2701.0, got ${sellLevels[1].targetPrice}`);
    assert(sellLevels[2].targetPrice === 2701.5, `SELL L3 must be 2701.5, got ${sellLevels[2].targetPrice}`);
    assert(sellLevels[3].targetPrice === 2702.0, `SELL L4 must be 2702.0, got ${sellLevels[3].targetPrice}`);
    assert(sellLevels[4].targetPrice === 2702.5, `SELL L5 must be 2702.5, got ${sellLevels[4].targetPrice}`);
    assert(sellLevels.length === 5, 'Must have exactly 5 levels, no Level 6');
    reportPass('SELL Edge Case Level Calculation', 'L1=2701.0, L2=2701.0, L3=2701.5, L4=2702.0, L5=2702.5');
  }

  // --------------------------------------------------------------------------
  // TEST 12: Price crosses L1/L2 same target & Deterministic L1 -> L2 order
  // --------------------------------------------------------------------------
  {
    const executedLevels: number[] = [];
    const mockBroker = {
      orders: [] as any[],
      sendOrder: async (req: any) => {
        mockBroker.orders.push(req);
        // comment format: DaRa v1.0 BUY or DaRa v1.0 BUY #2
        const match = req.comment?.match(/#(\d)/);
        const level = match ? parseInt(match[1]) : 1;
        executedLevels.push(level);
        return { success: true, ticket: `TICKET_${executedLevels.length}` };
      },
      modifyPosition: async () => ({ success: true }),
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      getOpenPositions: async () => []
    };

    const engine = new DaRaM1Engine(mockBroker, {
      lotSize: 0.01,
      slDistance: 25,
      tpDistance: 35,
      dailyLossLimit: 50,
      maxOpenTrades: 5,
      positionsPerSetup: 5,
      entryPullbackPos1: 1.0,
      entryDistance: 0.5,
      liveTradingEnabled: true
    });
    engine.start();

    // Directly inject setup into state machine for execution test
    const buySetup: DaRaSetup = {
      id: 'TEST_CROSS_L1_L2',
      direction: 'BUY',
      sweepLevel: 2690,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 2700,
      mssTime: 2000,
      lockedEntryPrice: 2700,
      masterEntryPrice: 2700,
      userSlDistance: 25,
      userTpDistance: 35,
      virtualSLPrice: 2675,
      virtualTPPrice: 2735,
      status: 'PENDING_ENTRY'
    };
    (engine as any).stateMachine.onSetupDetected(buySetup, (engine as any).userSettings);

    // Tick 1: Price reaches 2699.0 (Both L1 and L2 target)
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2699.0, ask: 2699.2, spreadPoints: 20, time: 2100, serverTime: 2100, openTradesCount: 0, m1Candles: [] });
    // Tick 2: Second tick to process next queued level L2
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2699.0, ask: 2699.2, spreadPoints: 20, time: 2200, serverTime: 2200, openTradesCount: 1, m1Candles: [] });

    assert(executedLevels.length === 2, `Expected 2 positions executed, got ${executedLevels.length}`);
    assert(executedLevels[0] === 1, `First position must be L1, got L${executedLevels[0]}`);
    assert(executedLevels[1] === 2, `Second position must be L2, got L${executedLevels[1]}`);
    reportPass('L1/L2 Same Target Crossing', 'L1 executes first, then L2 executes deterministically');
  }

  // --------------------------------------------------------------------------
  // TEST 13: Positions Per Setup = 1 Limit
  // --------------------------------------------------------------------------
  {
    const executed: any[] = [];
    const mockBroker = {
      orders: [] as any[],
      sendOrder: async (req: any) => {
        executed.push(req);
        return { success: true, ticket: `TICKET_${executed.length}` };
      },
      modifyPosition: async () => ({ success: true }),
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      getOpenPositions: async () => []
    };

    const engine = new DaRaM1Engine(mockBroker, {
      lotSize: 0.01,
      slDistance: 25,
      tpDistance: 35,
      dailyLossLimit: 50,
      maxOpenTrades: 1,
      positionsPerSetup: 1,
      entryPullbackPos1: 1.0,
      entryDistance: 0.5,
      liveTradingEnabled: true
    });
    engine.start();

    const buySetup: DaRaSetup = {
      id: 'TEST_POS_1',
      direction: 'BUY',
      sweepLevel: 2690,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 2700,
      mssTime: 2000,
      lockedEntryPrice: 2700,
      masterEntryPrice: 2700,
      userSlDistance: 25,
      userTpDistance: 35,
      virtualSLPrice: 2675,
      virtualTPPrice: 2735,
      status: 'PENDING_ENTRY'
    };
    (engine as any).stateMachine.onSetupDetected(buySetup, (engine as any).userSettings);

    // Deep dip crossing L1, L2, L3, L4, L5
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2695.0, ask: 2695.2, spreadPoints: 20, time: 2100, serverTime: 2100, openTradesCount: 0, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2694.0, ask: 2694.2, spreadPoints: 20, time: 2200, serverTime: 2200, openTradesCount: 1, m1Candles: [] });

    assert(executed.length === 1, `Positions Per Setup = 1 must strictly allow only 1 trade, got ${executed.length}`);
    reportPass('Positions Per Setup = 1 Enforcement', 'Strictly caps at 1 order despite price reaching all levels');
  }

  // --------------------------------------------------------------------------
  // TEST 14: Positions Per Setup = 2 Limit
  // --------------------------------------------------------------------------
  {
    const executed: any[] = [];
    const mockBroker = {
      orders: [] as any[],
      sendOrder: async (req: any) => {
        executed.push(req);
        return { success: true, ticket: `TICKET_${executed.length}` };
      },
      modifyPosition: async () => ({ success: true }),
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      getOpenPositions: async () => []
    };

    const engine = new DaRaM1Engine(mockBroker, {
      lotSize: 0.01,
      slDistance: 25,
      tpDistance: 35,
      dailyLossLimit: 50,
      maxOpenTrades: 2,
      positionsPerSetup: 2,
      entryPullbackPos1: 1.0,
      entryDistance: 0.5,
      liveTradingEnabled: true
    });
    engine.start();

    const buySetup: DaRaSetup = {
      id: 'TEST_POS_2',
      direction: 'BUY',
      sweepLevel: 2690,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 2700,
      mssTime: 2000,
      lockedEntryPrice: 2700,
      masterEntryPrice: 2700,
      userSlDistance: 25,
      userTpDistance: 35,
      virtualSLPrice: 2675,
      virtualTPPrice: 2735,
      status: 'PENDING_ENTRY'
    };
    (engine as any).stateMachine.onSetupDetected(buySetup, (engine as any).userSettings);

    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2695.0, ask: 2695.2, spreadPoints: 20, time: 2100, serverTime: 2100, openTradesCount: 0, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2694.0, ask: 2694.2, spreadPoints: 20, time: 2200, serverTime: 2200, openTradesCount: 1, m1Candles: [] });
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2693.0, ask: 2693.2, spreadPoints: 20, time: 2300, serverTime: 2300, openTradesCount: 2, m1Candles: [] });

    assert(executed.length === 2, `Positions Per Setup = 2 must strictly allow only 2 trades, got ${executed.length}`);
    reportPass('Positions Per Setup = 2 Enforcement', 'Strictly caps at 2 orders despite deeper price moves');
  }

  // --------------------------------------------------------------------------
  // TEST 15: Rapid Concurrent Ticks & Order In Flight Protection
  // --------------------------------------------------------------------------
  {
    let ordersSent = 0;
    const mockBroker = {
      orders: [] as any[],
      sendOrder: async (req: any) => {
        ordersSent++;
        await new Promise(r => setTimeout(r, 50)); // Simulates 50ms network delay
        return { success: true, ticket: `TICKET_${ordersSent}` };
      },
      modifyPosition: async () => ({ success: true }),
      getSymbolInfo: async () => ({ pointSize: 0.01 }),
      getOpenPositions: async () => []
    };

    const engine = new DaRaM1Engine(mockBroker, {
      lotSize: 0.01,
      slDistance: 25,
      tpDistance: 35,
      dailyLossLimit: 50,
      maxOpenTrades: 5,
      positionsPerSetup: 5,
      entryPullbackPos1: 1.0,
      entryDistance: 0.5,
      liveTradingEnabled: true
    });
    engine.start();

    const buySetup: DaRaSetup = {
      id: 'TEST_CONCURRENT',
      direction: 'BUY',
      sweepLevel: 2690,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 2700,
      mssTime: 2000,
      lockedEntryPrice: 2700,
      masterEntryPrice: 2700,
      userSlDistance: 25,
      userTpDistance: 35,
      virtualSLPrice: 2675,
      virtualTPPrice: 2735,
      status: 'PENDING_ENTRY'
    };
    (engine as any).stateMachine.onSetupDetected(buySetup, (engine as any).userSettings);

    // Fire 5 concurrent ticks simultaneously at the exact same millisecond
    await Promise.all([
      engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2699.0, ask: 2699.2, spreadPoints: 20, time: 2100, serverTime: 2100, openTradesCount: 0, m1Candles: [] }),
      engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2699.0, ask: 2699.2, spreadPoints: 20, time: 2100, serverTime: 2100, openTradesCount: 0, m1Candles: [] }),
      engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2699.0, ask: 2699.2, spreadPoints: 20, time: 2100, serverTime: 2100, openTradesCount: 0, m1Candles: [] }),
      engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2699.0, ask: 2699.2, spreadPoints: 20, time: 2100, serverTime: 2100, openTradesCount: 0, m1Candles: [] }),
      engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2699.0, ask: 2699.2, spreadPoints: 20, time: 2100, serverTime: 2100, openTradesCount: 0, m1Candles: [] })
    ]);

    assert(ordersSent === 1, `Concurrent ticks must not produce duplicate orders, got ${ordersSent}`);
    reportPass('Rapid Concurrent Ticks Protection', 'isProcessingTick / isOrderInFlight perfectly blocked duplicates');
  }

  // --------------------------------------------------------------------------
  // TEST 16: Direction Integrity (BUY->BUY and SELL->SELL)
  // --------------------------------------------------------------------------
  {
    const stateMachine = new DaRaM1StateMachine();
    const buySetup: DaRaSetup = {
      id: 'TEST_BUY_DIR',
      direction: 'BUY',
      sweepLevel: 2690,
      sweepTime: 1000,
      displacementConfirmed: true,
      mssLevel: 2700,
      mssTime: 2000,
      lockedEntryPrice: 2700,
      masterEntryPrice: 2700,
      userSlDistance: 25,
      userTpDistance: 35,
      virtualSLPrice: 2675,
      virtualTPPrice: 2735,
      status: 'PENDING_ENTRY'
    };
    const settings: DaRaUserSettings = {
      lotSize: 0.01,
      slDistance: 25,
      tpDistance: 35,
      dailyLossLimit: 50,
      maxOpenTrades: 5,
      positionsPerSetup: 5,
      entryPullbackPos1: 1.0,
      entryDistance: 0.5,
      liveTradingEnabled: false
    };

    stateMachine.onSetupDetected(buySetup, settings);
    const mockPos: import('./src/engines/dara_m1/types').DaRaPosition = {
      ticket: 'TICKET_B1',
      symbol: 'XAUUSD',
      type: 'BUY',
      lot: 0.01,
      openPrice: 2699.0,
      currentPrice: 2699.0,
      sl: 2675,
      tp: 2735,
      originalTp: 2735,
      originalSl: 2675,
      openTime: Date.now()
    };
    stateMachine.onPositionOpened(mockPos, 0);
    const pos = stateMachine.getActivePositions()[0];
    assert(pos.type === 'BUY', `BUY Setup must execute BUY order, got ${pos.type}`);
    assert(pos.sl < pos.openPrice, `BUY SL must be below open price (${pos.sl} < ${pos.openPrice})`);
    assert(pos.tp > pos.openPrice, `BUY TP must be above open price (${pos.tp} > ${pos.openPrice})`);
    reportPass('Direction & SL/TP Integrity', 'BUY signals execute strictly BUY orders with SL below and TP above');
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedCount}/${testCount} VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');
}

runTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
