/**
 * Dynamic Settings Verification Test Suite
 * Tests Dashboard Save -> Server sync -> In-memory DaRa Engine immediate update without restart.
 */
import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaBrokerInterface, DaRaUserSettings, DaRaMarketFeed } from './src/engines/dara_m1/types';
import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaOrderExecution } from './src/engines/dara_m1/DaRaOrderExecution';

class MockBroker implements DaRaBrokerInterface {
  public openedOrders: any[] = [];
  public openPositions: any[] = [];
  public modifiedOrders: any[] = [];

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
    this.modifiedOrders.push({ ticket, sl: newSl, tp: newTp });
    const pos = this.openPositions.find(p => String(p.ticket) === String(ticket));
    if (pos) {
      pos.sl = newSl;
      if (newTp !== undefined) pos.tp = newTp;
    }
    return { success: true };
  }
  async closePosition(ticket: string | number) {
    this.openPositions = this.openPositions.filter(p => String(p.ticket) !== String(ticket));
    return { success: true };
  }
  async getOpenPositions(symbol: string) {
    return this.openPositions.filter(p => p.symbol === symbol);
  }
}

async function runDynamicSettingsTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING DYNAMIC SETTINGS SYSTEM VERIFICATION TESTS');
  console.log('================================================================\n');

  const broker = new MockBroker();
  const initialSettings: DaRaUserSettings = {
    lotSize: 0.02,
    slDistance: 10,
    tpDistance: 8,
    dailyLossLimit: 2000,
    entryDistance: 2.0,
    additionalEntryDistance: 4.0,
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

  const engine = new DaRaM1Engine(broker, initialSettings);
  engine.start();

  // Test 1: Initial Settings Verification
  console.log('TEST 1: Verify Initial Engine Settings');
  let currentSettings = engine.getUserSettings();
  if (currentSettings.lotSize !== 0.02) throw new Error(`Initial lotSize mismatch: expected 0.02, got ${currentSettings.lotSize}`);
  if (currentSettings.slDistance !== 10) throw new Error(`Initial slDistance mismatch: expected 10, got ${currentSettings.slDistance}`);
  if (currentSettings.tpDistance !== 8) throw new Error(`Initial tpDistance mismatch: expected 8, got ${currentSettings.tpDistance}`);
  if (currentSettings.entryDistance !== 2.0) throw new Error(`Initial entryDistance mismatch: expected 2.0, got ${currentSettings.entryDistance}`);
  if (currentSettings.additionalEntryDistance !== 4.0) throw new Error(`Initial additionalEntryDistance mismatch: expected 4.0, got ${currentSettings.additionalEntryDistance}`);
  if (currentSettings.trailingDistance !== 1.5) throw new Error(`Initial trailingDistance mismatch: expected 1.5, got ${currentSettings.trailingDistance}`);
  console.log('✅ TEST 1 PASSED: Initial Settings match expected specification.\n');

  // Test 2: Dynamic Update - Dashboard sends new values WITHOUT restart
  console.log('TEST 2: Dashboard Save -> Engine dynamically updates in-memory (No restart)');
  const updatedSettingsFromDashboard: Partial<DaRaUserSettings> = {
    lotSize: 0.05,
    slDistance: 12,
    tpDistance: 10,
    dailyLossLimit: 1500,
    entryDistance: 2.5,
    additionalEntryDistance: 5.0,
    trailingEnabled: true,
    trailingDistance: 2.0,
    maxSpreadPoints: 35,
    newsFilterEnabled: false
  };

  // Simulate server calling engine.updateUserSettings when Dashboard saves
  engine.updateUserSettings(updatedSettingsFromDashboard);

  currentSettings = engine.getUserSettings();
  if (currentSettings.lotSize !== 0.05) throw new Error(`Dynamic lotSize failed: expected 0.05, got ${currentSettings.lotSize}`);
  if (currentSettings.slDistance !== 12) throw new Error(`Dynamic slDistance failed: expected 12, got ${currentSettings.slDistance}`);
  if (currentSettings.tpDistance !== 10) throw new Error(`Dynamic tpDistance failed: expected 10, got ${currentSettings.tpDistance}`);
  if (currentSettings.dailyLossLimit !== 1500) throw new Error(`Dynamic dailyLossLimit failed: expected 1500, got ${currentSettings.dailyLossLimit}`);
  if (currentSettings.entryDistance !== 2.5) throw new Error(`Dynamic entryDistance failed: expected 2.5, got ${currentSettings.entryDistance}`);
  if (currentSettings.additionalEntryDistance !== 5.0) throw new Error(`Dynamic additionalEntryDistance failed: expected 5.0, got ${currentSettings.additionalEntryDistance}`);
  if (currentSettings.trailingDistance !== 2.0) throw new Error(`Dynamic trailingDistance failed: expected 2.0, got ${currentSettings.trailingDistance}`);
  if (currentSettings.maxSpreadPoints !== 35) throw new Error(`Dynamic maxSpreadPoints failed: expected 35, got ${currentSettings.maxSpreadPoints}`);
  if (currentSettings.newsFilterEnabled !== false) throw new Error(`Dynamic newsFilterEnabled failed: expected false, got ${currentSettings.newsFilterEnabled}`);
  console.log('✅ TEST 2 PASSED: All 9 settings dynamically updated in-memory without restarting the bot!\n');

  // Test 3: Order Execution Uses Dynamically Updated Settings
  console.log('TEST 3: Order Execution Engine immediately executes with dynamic lotSize & SL/TP');
  const execution = new DaRaOrderExecution(broker);
  const dummySetup: any = {
    id: 'SETUP_TEST_01',
    direction: 'BUY',
    signalPrice: 2700.0,
    sweepLevel: 2695.0,
    mssLevel: 2702.0,
    time: Date.now()
  };

  const execResult = await execution.executeOrder(
    dummySetup,
    'XAUUSDm',
    2700.0, // currentAsk
    2699.8, // currentBid
    currentSettings,
    1
  );

  if (!execResult.success) throw new Error(`Execution failed: ${execResult.error}`);
  const lastOrder = broker.openedOrders[broker.openedOrders.length - 1];
  console.log('Executed Order details:', lastOrder);

  // BUY openPrice = 2700.0
  // Dynamic Lot = 0.05
  // Dynamic SL = 2700.0 - 12 = 2688.0
  // Dynamic TP = 2700.0 + 10 = 2710.0
  if (lastOrder.lot !== 0.05) throw new Error(`Executed lot mismatch: expected 0.05, got ${lastOrder.lot}`);
  if (lastOrder.sl !== 2688.0) throw new Error(`Executed SL mismatch: expected 2688.0, got ${lastOrder.sl}`);
  if (lastOrder.tp !== 2710.0) throw new Error(`Executed TP mismatch: expected 2710.0, got ${lastOrder.tp}`);
  console.log('✅ TEST 3 PASSED: Order was opened with exact dynamic settings (Lot: 0.05, SL: 2688.0 [dist=12], TP: 2710.0 [dist=10]).\n');

  // Test 4: Trailing Engine Uses Dynamically Updated Trailing Distance
  console.log('TEST 4: Trailing Engine immediately uses dynamic trailingDistance (2.0 instead of 1.5)');
  const trailing = new DaRaProfitTrailing();
  const testPos: any = {
    ticket: 99999,
    symbol: 'XAUUSDm',
    type: 'BUY',
    lot: 0.05,
    openPrice: 2700.0,
    sl: 2688.0,
    tp: 2710.0,
    originalTp: 2710.0,
    trailingActivated: false
  };

  // Price touches TP at 2710.0
  const trailResult1 = trailing.calculateTrailingSL(testPos, 2710.0, 2710.2, currentSettings);
  // With dynamic trailingDistance = 2.0, new SL should be 2710.0 - 2.0 = 2708.0 (NOT 2708.5)
  if (!trailResult1.shouldModify) throw new Error('Trailing should have activated at TP');
  if (trailResult1.newSl !== 2708.0) throw new Error(`Dynamic Trailing SL mismatch: expected 2708.0, got ${trailResult1.newSl}`);
  console.log(`Trailing SL at TP (2710.0): ${trailResult1.newSl} (Distance = 2.0)`);
  console.log('✅ TEST 4 PASSED: Trailing engine applied dynamic distance 2.0 correctly!\n');

  // Test 5: Reverting/Changing again on the fly (e.g. SL = 10, Trailing = 1.5)
  console.log('TEST 5: Second dynamic update on the fly to confirm full repeatability');
  engine.updateUserSettings({
    slDistance: 10,
    trailingDistance: 1.5,
    lotSize: 0.01
  });
  const updatedAgain = engine.getUserSettings();
  if (updatedAgain.slDistance !== 10) throw new Error('Failed to update slDistance back to 10');
  if (updatedAgain.trailingDistance !== 1.5) throw new Error('Failed to update trailingDistance back to 1.5');
  if (updatedAgain.lotSize !== 0.01) throw new Error('Failed to update lotSize back to 0.01');
  console.log('✅ TEST 5 PASSED: Second live update succeeded immediately.\n');

  console.log('================================================================');
  console.log('🎉 ALL DYNAMIC SETTINGS TESTS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runDynamicSettingsTests().catch(err => {
  console.error('❌ DYNAMIC SETTINGS TEST SUITE FAILED:', err);
  process.exit(1);
});
