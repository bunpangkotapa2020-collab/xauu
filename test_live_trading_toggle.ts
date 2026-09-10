import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaOrderExecution } from './src/engines/dara_m1/DaRaOrderExecution';

let executedOrders: any[] = [];
let brokerModifyCalled = false;

const mockBroker = {
  getSymbolInfo: async () => ({ pointSize: 0.01 }),
  sendOrder: async (req: any) => {
    executedOrders.push(req);
    return { success: true, ticket: '123' };
  }
};

const baseSettings = {
  lotSize: 0.05, slDistance: 10, tpDistance: 8, dailyLossLimit: 2000,
  maxOpenTrades: 5, maxConsecutiveSL: 6, cooldownMinutes: 20, maxSpreadPoints: 27,
  newsFilterEnabled: false, newsMinsBefore: 0, newsMinsAfter: 0, trailingEnabled: true,
  entryDistance: 2.0, 
  liveTradingEnabled: false // DEFAULT OFF
};

async function runTests() {
  executedOrders = [];
  
  // 1. Initialize Engine with LIVE OFF
  const engine = new DaRaM1Engine(mockBroker as any, baseSettings);
  engine.start();
  
  const execution = new DaRaOrderExecution(mockBroker as any, undefined);
  
  console.log("--- TEST 1: OFF BLOCK ---");
  let result = await execution.executeOrder(
      { direction: 'BUY', signalPrice: 2000, lockedEntryPrice: 2000, sharedSL: 1990, sharedTP: 2010 } as any,
      'XAUUSD', 2000, 2000, engine.getUserSettings(), 1, true
  );
  
  if (result.success !== false || !result.error?.includes("LIVE TRADING IS OFF")) {
      throw new Error("Test 1 Failed: Broker order was NOT blocked when LIVE is OFF.");
  }
  console.log("✅ OFF BLOCK -> Broker order blocked successfully.");
  
  console.log("--- TEST 2: EXPLICIT ON ---");
  engine.updateUserSettings({ liveTradingEnabled: true });
  result = await execution.executeOrder(
      { direction: 'BUY', signalPrice: 2000, lockedEntryPrice: 2000, sharedSL: 1990, sharedTP: 2010 } as any,
      'XAUUSD', 2000, 2000, engine.getUserSettings(), 2, true // used level 2
  );
  if (result.success !== true) {
      throw new Error("Test 2 Failed: Broker order blocked when LIVE is ON. Error: " + result.error);
  }
  console.log("✅ Explicit ON -> Setting reaches DaRa Engine and execution succeeds.");
  
  console.log("--- TEST 3: SAFETY GUARD FAILURE ---");
  engine.stop();
  console.log("Safety guard checking done via DaRaServerBroker tests.");
  
  console.log("--- TEST 4: OFF AFTER ON ---");
  engine.start();
  engine.updateUserSettings({ liveTradingEnabled: false });
  result = await execution.executeOrder(
      { direction: 'BUY', signalPrice: 2000, lockedEntryPrice: 2000, sharedSL: 1990, sharedTP: 2010 } as any,
      'XAUUSD', 2000, 2000, engine.getUserSettings(), 3, true // used level 3
  );
  
  if (result.success !== false || !result.error?.includes("LIVE TRADING IS OFF")) {
      throw new Error("Test 4 Failed: Broker order was NOT blocked when LIVE is turned OFF.");
  }
  console.log("✅ OFF AFTER ON -> Broker order blocked successfully.");
  
  console.log("ALL ENGINE LIVE TRADING TESTS PASSED");
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
