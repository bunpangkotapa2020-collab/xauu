import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1Strategy } from './src/engines/dara_m1/DaRaM1Strategy';
import { DaRaCandle, DaRaUserSettings, DaRaPosition } from './src/engines/dara_m1/types';

class MockBroker {
  public openPositions: DaRaPosition[] = [];
  public orderCounter: number = 1;
  public sentOrders: any[] = [];

  async sendOrder(order: any) {
    const ticket = `T_${this.orderCounter++}`;
    const pos: DaRaPosition = {
      ticket,
      symbol: order.symbol,
      type: order.type,
      lot: order.lot,
      openPrice: order.openPrice,
      sl: order.sl,
      tp: order.tp,
      originalTp: order.tp,
      originalSl: order.sl,
      openTime: Date.now()
    };
    this.openPositions.push(pos);
    this.sentOrders.push({ ticket, ...order });
    return { success: true, ticket };
  }

  async modifyPosition(ticket: string | number, newSl: number, newTp?: number) {
    const pos = this.openPositions.find(p => String(p.ticket) === String(ticket));
    if (pos) {
      pos.sl = newSl;
      if (newTp !== undefined) pos.tp = newTp;
      return { success: true };
    }
    return { success: false, error: 'Position not found' };
  }

  async getOpenPositions(symbol: string) {
    return [...this.openPositions];
  }

  async getSymbolInfo(symbol: string) {
    return { pointSize: 0.01 };
  }
}

/**
 * Creates a valid M1 candle series containing a clean Bullish setup:
 * Swing Low -> Sweep -> Bullish Displacement -> Bullish MSS
 */
function createBuySetupCandles(startTimeMs: number, basePrice: number = 2000): DaRaCandle[] {
  const candles: DaRaCandle[] = [];
  let t = startTimeMs;

  // Background bars 0-3
  candles.push({ time: t, open: basePrice, high: basePrice + 1, low: basePrice - 1, close: basePrice, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice, high: basePrice + 1, low: basePrice - 1, close: basePrice, volume: 100 }); t += 60000;
  
  // Bar 2: Target Swing High at basePrice + 3 (prior high)
  candles.push({ time: t, open: basePrice + 2, high: basePrice + 4, low: basePrice + 1, close: basePrice + 3, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice + 2, high: basePrice + 2.5, low: basePrice + 0.5, close: basePrice + 1, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice + 1, high: basePrice + 1.5, low: basePrice, close: basePrice + 0.5, volume: 100 }); t += 60000;

  // Bar 5: Fractal Swing Low at basePrice - 5 (low: basePrice - 6)
  candles.push({ time: t, open: basePrice, high: basePrice + 0.5, low: basePrice - 6, close: basePrice - 4, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice - 4, high: basePrice - 3, low: basePrice - 5, close: basePrice - 3.5, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice - 3.5, high: basePrice - 2.5, low: basePrice - 4.5, close: basePrice - 3, volume: 100 }); t += 60000;

  // Bar 8: Sweep bar: dips to basePrice - 7 (< -6), closes at basePrice - 3 (> -6)
  candles.push({ time: t, open: basePrice - 4, high: basePrice - 2, low: basePrice - 7, close: basePrice - 3, volume: 100 }); t += 60000;

  // Bar 9: Bullish Displacement: body 5, range 6 -> body/range = 0.83 >= 0.45
  candles.push({ time: t, open: basePrice - 2, high: basePrice + 3.5, low: basePrice - 2.5, close: basePrice + 3, volume: 100 }); t += 60000;

  // Bar 10: Bullish MSS: closes at basePrice + 5 (> targetSwingHigh high 4)
  candles.push({ time: t, open: basePrice + 3, high: basePrice + 5.5, low: basePrice + 2.8, close: basePrice + 5, volume: 100 }); t += 60000;

  // Buffer bars
  candles.push({ time: t, open: basePrice + 5, high: basePrice + 5.2, low: basePrice + 4.8, close: basePrice + 5.1, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice + 5.1, high: basePrice + 5.3, low: basePrice + 4.9, close: basePrice + 5.0, volume: 100 });

  return candles;
}

/**
 * Creates a valid M1 candle series containing a clean Bearish setup:
 * Swing High -> Sweep -> Bearish Displacement -> Bearish MSS
 */
function createSellSetupCandles(startTimeMs: number, basePrice: number = 2000): DaRaCandle[] {
  const candles: DaRaCandle[] = [];
  let t = startTimeMs;

  // Background bars
  candles.push({ time: t, open: basePrice, high: basePrice + 1, low: basePrice - 1, close: basePrice, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice, high: basePrice + 1, low: basePrice - 1, close: basePrice, volume: 100 }); t += 60000;

  // Bar 2: Target Swing Low at basePrice - 3
  candles.push({ time: t, open: basePrice - 2, high: basePrice - 1, low: basePrice - 4, close: basePrice - 3, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice - 2, high: basePrice - 0.5, low: basePrice - 2.5, close: basePrice - 1, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice - 1, high: basePrice, low: basePrice - 1.5, close: basePrice - 0.5, volume: 100 }); t += 60000;

  // Bar 5: Fractal Swing High at basePrice + 5 (high: basePrice + 6)
  candles.push({ time: t, open: basePrice, high: basePrice + 6, low: basePrice - 0.5, close: basePrice + 4, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice + 4, high: basePrice + 5, low: basePrice + 3, close: basePrice + 3.5, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice + 3.5, high: basePrice + 4.5, low: basePrice + 2.5, close: basePrice + 3, volume: 100 }); t += 60000;

  // Bar 8: Sweep bar: wicks to basePrice + 7 (> +6), closes at basePrice + 3 (< +6)
  candles.push({ time: t, open: basePrice + 4, high: basePrice + 7, low: basePrice + 2, close: basePrice + 3, volume: 100 }); t += 60000;

  // Bar 9: Bearish Displacement: body 5, range 6 -> 0.83 >= 0.45
  candles.push({ time: t, open: basePrice + 2, high: basePrice + 2.5, low: basePrice - 3.5, close: basePrice - 3, volume: 100 }); t += 60000;

  // Bar 10: Bearish MSS: closes at basePrice - 5 (< targetSwingLow low -4)
  candles.push({ time: t, open: basePrice - 3, high: basePrice - 2.8, low: basePrice - 5.5, close: basePrice - 5, volume: 100 }); t += 60000;

  // Buffer bars
  candles.push({ time: t, open: basePrice - 5, high: basePrice - 4.8, low: basePrice - 5.2, close: basePrice - 5.1, volume: 100 }); t += 60000;
  candles.push({ time: t, open: basePrice - 5.1, high: basePrice - 4.9, low: basePrice - 5.3, close: basePrice - 5.0, volume: 100 });

  return candles;
}

const defaultSettings: DaRaUserSettings = {
  lotSize: 0.01,
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
  entryDistance: 2,
  liveTradingEnabled: true
};

async function runTests() {
  console.log('====================================================');
  console.log('🧪 DARA M1 SCAN BASELINE RESET & RE-ENTRY TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assertTest(name: string, condition: boolean, detail: string = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ PASS | ${name}${detail ? ` - ${detail}` : ''}`);
    } else {
      console.error(`❌ FAIL | ${name}${detail ? ` - ${detail}` : ''}`);
      throw new Error(`Test failed: ${name}`);
    }
  }

  // ---------------------------------------------------------------------------------
  // TEST 1: Ghost Setup Scenario (BUY active at 10:05, SELL MSS at 10:15, BUY closes at 10:25)
  // 10:15 SELL MSS MUST BE REJECTED at 10:26!
  // ---------------------------------------------------------------------------------
  console.log('--- TEST 1: Ghost Setup Rejection (Historical Setup During Trade) ---');
  {
    const strategy = new DaRaM1Strategy();
    const t1000 = 1710000000000; // 10:00:00
    const buyCandles = createBuySetupCandles(t1000, 2000);
    const buySetup = strategy.scanForSetup(buyCandles, defaultSettings, 0.01);
    assertTest('1.1 BUY Setup Detected', buySetup !== null && buySetup.direction === 'BUY');

    // Simulate trade open at 10:05 and SELL setup forming at 10:15
    const t1015 = t1000 + (15 * 60000); // 10:15:00
    const sellCandles = createSellSetupCandles(t1015, 2000);
    
    // Trade closes at 10:25:00
    const t1025 = t1000 + (25 * 60000); // 10:25:00
    strategy.setScanBaselineTime(t1025);

    // At 10:26, scan includes the 10:15 SELL setup candles
    const ghostScanResult = strategy.scanForSetup(sellCandles, defaultSettings, 0.01);
    assertTest(
      '1.2 Ghost Setup Rejected', 
      ghostScanResult === null, 
      '10:15 SELL setup formed before 10:25 close was correctly rejected'
    );
  }

  // ---------------------------------------------------------------------------------
  // TEST 2: Fresh Post-Close Setup Acceptance (SELL formed at 10:30, after 10:25 close)
  // ---------------------------------------------------------------------------------
  console.log('\n--- TEST 2: Fresh Post-Close Setup Acceptance ---');
  {
    const strategy = new DaRaM1Strategy();
    const t1025 = 1710001500000; // 10:25:00 (trade close baseline)
    strategy.setScanBaselineTime(t1025);

    // Fresh setup completely formed at 10:30 (after 10:25)
    const t1030 = t1025 + (5 * 60000); // 10:30:00
    const freshSellCandles = createSellSetupCandles(t1030, 2000);

    const freshSetup = strategy.scanForSetup(freshSellCandles, defaultSettings, 0.01);
    assertTest(
      '2.1 Fresh Setup Accepted',
      freshSetup !== null && freshSetup.direction === 'SELL',
      `Fresh setup detected at time ${freshSetup?.mssTime} > baseline ${t1025}`
    );
    assertTest(
      '2.2 Fresh Setup Timestamp Strictness',
      (freshSetup?.mssTime || 0) > t1025 && (freshSetup?.sweepTime || 0) > t1025,
      'Both sweep and MSS occurred strictly after the scan baseline'
    );
  }

  // ---------------------------------------------------------------------------------
  // TEST 3: Same-Direction Re-entry (BUY -> BUY)
  // ---------------------------------------------------------------------------------
  console.log('\n--- TEST 3: Same-Direction Re-entry (BUY -> BUY) ---');
  {
    const strategy = new DaRaM1Strategy();
    const tClose = 1710002000000;
    strategy.setScanBaselineTime(tClose);

    // Historical BUY candles formed before tClose
    const oldBuyCandles = createBuySetupCandles(tClose - (20 * 60000), 2000);
    const oldResult = strategy.scanForSetup(oldBuyCandles, defaultSettings, 0.01);
    assertTest('3.1 Historical BUY Rejected', oldResult === null, 'Pre-close BUY setup rejected');

    // Fresh BUY candles formed after tClose
    const freshBuyCandles = createBuySetupCandles(tClose + (5 * 60000), 2000);
    const freshResult = strategy.scanForSetup(freshBuyCandles, defaultSettings, 0.01);
    assertTest('3.2 Fresh BUY Accepted', freshResult !== null && freshResult.direction === 'BUY', 'Post-close BUY setup accepted');
  }

  // ---------------------------------------------------------------------------------
  // TEST 4: Opposite-Direction Re-entry (SELL -> BUY)
  // ---------------------------------------------------------------------------------
  console.log('\n--- TEST 4: Opposite-Direction Re-entry (SELL -> BUY) ---');
  {
    const strategy = new DaRaM1Strategy();
    const tClose = 1710003000000;
    strategy.setScanBaselineTime(tClose);

    // Historical BUY setup formed during or before SELL trade
    const staleBuyCandles = createBuySetupCandles(tClose - (10 * 60000), 2000);
    const staleResult = strategy.scanForSetup(staleBuyCandles, defaultSettings, 0.01);
    assertTest('4.1 Stale Opposite Setup Rejected', staleResult === null, 'Pre-close BUY setup rejected');

    // Fresh BUY setup formed after SELL closed
    const freshBuyCandles = createBuySetupCandles(tClose + (2 * 60000), 2000);
    const freshResult = strategy.scanForSetup(freshBuyCandles, defaultSettings, 0.01);
    assertTest('4.2 Fresh Opposite Setup Accepted', freshResult !== null && freshResult.direction === 'BUY', 'Post-close BUY setup accepted');
  }

  // ---------------------------------------------------------------------------------
  // TEST 5: Engine Full Lifecycle Integration with Scan Baseline Reset
  // ---------------------------------------------------------------------------------
  console.log('\n--- TEST 5: Engine Full Lifecycle Integration ---');
  {
    const broker = new MockBroker();
    const engine = new DaRaM1Engine(broker);
    engine.updateUserSettings({ ...defaultSettings, liveTradingEnabled: true });
    engine.start();

    const tStart = 1710004000000;
    const buyCandles = createBuySetupCandles(tStart, 2000);
    const lastBar = buyCandles[buyCandles.length - 1];

    // Tick 1: Detect BUY setup
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2005,
      ask: 2005.2,
      spreadPoints: 20,
      serverTime: lastBar.time,
      m1Candles: buyCandles,
      openTradesCount: 0
    });

    const setup = engine.getCurrentSetup();
    assertTest('5.1 Setup Detected and Locked', setup !== null && setup.direction === 'BUY');

    // Tick 2: Trigger Entry Level 1 (pullback to lockedEntryPrice - 2)
    const entryTarget = setup!.entryLevels[0].targetPrice;
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: entryTarget,
      ask: entryTarget + 0.2,
      spreadPoints: 20,
      serverTime: lastBar.time + 60000,
      m1Candles: buyCandles,
      openTradesCount: 0
    });

    assertTest('5.2 Trade Entered', broker.openPositions.length === 1);
    const openPos = broker.openPositions[0];

    // Close the trade at a future timestamp (e.g. 15 minutes later)
    const tTradeClose = lastBar.time + (15 * 60000);
    await engine.handlePositionClosed(
      openPos.ticket,
      'TP_HIT',
      50.0,
      openPos.tp,
      tTradeClose
    );

    // Trade is closed, active positions is 0
    assertTest('5.3 Trade Closed Successfully', engine.getActivePosition() === null);
    assertTest('5.4 State Reset to SCANNING', engine.getState() === 'SCANNING');
    assertTest('5.5 Setup Cleared', engine.getCurrentSetup() === null);

    // Verify baseline time matches tTradeClose
    const baseline = engine.getScanBaselineTime();
    assertTest('5.6 Scan Baseline Set to Trade Close Time', baseline === tTradeClose, `Baseline: ${baseline} === CloseTime: ${tTradeClose}`);

    // Now send candles with a setup formed during the previous trade (ending before tTradeClose)
    const ghostCandles = createSellSetupCandles(tTradeClose - (20 * 60000), 2000);
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2000,
      ask: 2000.2,
      spreadPoints: 20,
      serverTime: tTradeClose + 60000,
      m1Candles: ghostCandles,
      openTradesCount: 0
    });
    assertTest('5.7 Ghost Setup NOT Accepted by Engine', engine.getCurrentSetup() === null, 'Engine correctly stayed in SCANNING without picking up ghost setup');

    // Now send candles with a fresh setup formed at tTradeClose + 2 mins
    const freshPostCloseCandles = createSellSetupCandles(tTradeClose + (2 * 60000), 2000);
    const freshBar = freshPostCloseCandles[freshPostCloseCandles.length - 1];
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 1995,
      ask: 1995.2,
      spreadPoints: 20,
      serverTime: freshBar.time,
      m1Candles: freshPostCloseCandles,
      openTradesCount: 0
    });
    assertTest('5.8 Fresh Post-Close Setup Accepted by Engine', engine.getCurrentSetup() !== null && engine.getCurrentSetup()?.direction === 'SELL');
  }

  // ---------------------------------------------------------------------------------
  // TEST 6: LIVE OFF Pass Verification
  // ---------------------------------------------------------------------------------
  console.log('\n--- TEST 6: LIVE OFF PASS Verification ---');
  {
    const broker = new MockBroker();
    const engine = new DaRaM1Engine(broker);
    // LIVE OFF by default!
    engine.start();
    const initialSettings = engine.getUserSettings();
    assertTest('6.1 LIVE TRADING OFF by Default', initialSettings.liveTradingEnabled === false);

    const candles = createBuySetupCandles(Date.now(), 2000);
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: 2005,
      ask: 2005.2,
      spreadPoints: 20,
      serverTime: Date.now(),
      m1Candles: candles,
      openTradesCount: 0
    });

    const setup = engine.getCurrentSetup();
    if (setup) {
      const entryTarget = setup.entryLevels[0].targetPrice;
      await engine.onMarketUpdate({
        symbol: 'XAUUSD',
        bid: entryTarget,
        ask: entryTarget + 0.2,
        spreadPoints: 20,
        serverTime: Date.now(),
        m1Candles: candles,
        openTradesCount: 0
      });
    }

    assertTest('6.2 Zero Orders Placed When LIVE OFF', broker.sentOrders.length === 0, 'No orders executed while LIVE OFF');
  }

  console.log('\n====================================================');
  console.log(`📋 SUMMARY: ${passed}/${total} TESTS PASSED CLEANLY (100%)`);
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test suite failed with error:', err);
  process.exit(1);
});
