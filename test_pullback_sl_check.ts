/**
 * Verification test for 2-Position Pullback with SL = 10 raw price distance
 */
import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaBrokerInterface, DaRaUserSettings, DaRaMarketFeed, DaRaCandle } from './src/engines/dara_m1/types';

class MockBroker implements DaRaBrokerInterface {
  public openedOrders: any[] = [];
  public openPositions: any[] = [];

  async getAccountInfo() {
    return { balance: 2000, equity: 2000, currency: 'USC', freeMargin: 2000, isConnected: true };
  }
  async getSymbolInfo(symbol: string) {
    return { symbol, pointSize: 0.01, minLot: 0.01, maxLot: 100, lotStep: 0.01, spreadPoints: 15 };
  }
  async sendOrder(order: any) {
    const ticket = 10001 + this.openedOrders.length;
    const pos = {
      ticket,
      symbol: order.symbol,
      type: order.type,
      lot: order.lot,
      openPrice: order.openPrice,
      openTime: Date.now(),
      sl: order.sl,
      tp: order.tp,
      originalTp: order.tp,
      unrealizedProfit: 0,
      trailingActivated: false
    };
    this.openedOrders.push(order);
    this.openPositions.push(pos);
    return { success: true, ticket, position: pos };
  }
  async modifyPosition(ticket: string | number, newSl: number, newTp?: number) {
    return { success: true };
  }
  async closePosition(ticket: string | number) {
    return { success: true };
  }
  async getOpenPositions(symbol: string) {
    return this.openPositions.filter(p => p.symbol === symbol);
  }
}

async function verifyPullbackAndSl() {
  console.log('--- Verifying 2-Position Pullback & SL = 10 raw price distance ---');
  const broker = new MockBroker();
  const settings: DaRaUserSettings = {
    lotSize: 0.01,
    slDistance: 10.0, // Strict user setting: SL = 10 raw price distance
    tpDistance: 8.0,
    dailyLossLimit: 2000,
    entryDistance: 2.0, // Pos #1 pullback
    additionalEntryDistance: 4.0, // Pos #2 pullback
    trailingEnabled: true,
    trailingDistance: 1.5,
    trailingRule: 'Auto at Original TP (1.5 Price Distance)',
    maxOpenTrades: 4,
    maxConsecutiveSL: 6,
    cooldownMinutes: 20,
    maxSpreadPoints: 27,
    newsFilterEnabled: true,
    newsMinsBefore: 30,
    newsMinsAfter: 30
  };

  const engine = new DaRaM1Engine(broker, settings);
  engine.start();

  // Create candles triggering BUY setup
  // Signal at 2704.0
  // Pullback Pos #1 target = 2704.0 - 2.0 = 2702.0
  // When Pos #1 enters at 2702.0, SL MUST BE: 2702.0 - 10 = 2692.0 (NOT 2698!)
  const candles: DaRaCandle[] = [];
  const now = Date.now();
  for (let i = 0; i < 30; i++) {
    candles.push({
      time: now - (30 - i) * 60000,
      open: 2700,
      high: 2705,
      low: 2698,
      close: 2702,
      volume: 100
    });
  }

  // Directly simulate execution through DaRaOrderExecution
  const { DaRaOrderExecution } = await import('./src/engines/dara_m1/DaRaOrderExecution');
  const execution = new DaRaOrderExecution(broker);

  const buySetup: any = {
    id: 'SETUP_BUY_01',
    direction: 'BUY',
    signalPrice: 2704.0,
    pos1TargetPrice: 2702.0,
    pos2TargetPrice: 2700.0,
    time: Date.now()
  };

  // Pos #1 execution at 2702.0
  const res1 = await execution.executeOrder(buySetup, 'XAUUSDm', 2702.0, 2701.8, settings, 1);
  if (!res1.success) throw new Error(`Pos 1 failed: ${res1.error}`);
  const order1 = broker.openedOrders[0];
  console.log('Pos #1 Order:', order1);

  if (order1.openPrice !== 2702.0) throw new Error(`Pos 1 openPrice mismatch: ${order1.openPrice}`);
  if (order1.sl !== 2692.0) throw new Error(`Pos 1 SL mismatch: expected 2692.0 (10 raw distance), got ${order1.sl}`);
  if (order1.tp !== 2710.0) throw new Error(`Pos 1 TP mismatch: expected 2710.0 (8 raw distance), got ${order1.tp}`);
  console.log(`✅ Pos #1 Verified: Entry=2702.0 -> SL=2692.0 (SL Distance = ${order1.openPrice - order1.sl} raw price distance)`);

  // Pos #2 execution at 2700.0
  const res2 = await execution.executeOrder(buySetup, 'XAUUSDm', 2700.0, 2699.8, settings, 2);
  if (!res2.success) throw new Error(`Pos 2 failed: ${res2.error}`);
  const order2 = broker.openedOrders[1];
  console.log('Pos #2 Order:', order2);

  if (order2.openPrice !== 2700.0) throw new Error(`Pos 2 openPrice mismatch: ${order2.openPrice}`);
  if (order2.sl !== 2690.0) throw new Error(`Pos 2 SL mismatch: expected 2690.0 (10 raw distance), got ${order2.sl}`);
  if (order2.tp !== 2708.0) throw new Error(`Pos 2 TP mismatch: expected 2708.0 (8 raw distance), got ${order2.tp}`);
  console.log(`✅ Pos #2 Verified: Entry=2700.0 -> SL=2690.0 (SL Distance = ${order2.openPrice - order2.sl} raw price distance)`);

  console.log('🎉 SL/TP 10 RAW PRICE DISTANCE VERIFICATION PASSED PERFECTLY!');
}

verifyPullbackAndSl().catch(e => {
  console.error(e);
  process.exit(1);
});
