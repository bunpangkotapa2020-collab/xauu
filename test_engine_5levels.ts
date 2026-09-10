import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';
import { DaRaOrderExecution } from './src/engines/dara_m1/DaRaOrderExecution';

let executedOrders: any[] = [];
const mockBroker = {
  getSymbolInfo: async () => ({ pointSize: 0.01 }),
  sendOrder: async (req: any) => {
    executedOrders.push(req);
    return { success: true, ticket: '123' + executedOrders.length };
  }
};

const baseSettings = {
  lotSize: 0.05, slDistance: 30, tpDistance: 8, dailyLossLimit: 2000,
  maxOpenTrades: 5, maxConsecutiveSL: 6, cooldownMinutes: 20, maxSpreadPoints: 27,
  newsFilterEnabled: false, newsMinsBefore: 0, newsMinsAfter: 0, trailingEnabled: true,
  entryDistance: 2.0, liveTradingEnabled: true
};

async function testScenarioBuy() {
  executedOrders = [];
  const engine = new DaRaM1Engine(mockBroker as any, baseSettings);
  engine.start();
  (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

  const sm = (engine as any).stateMachine as DaRaM1StateMachine;
  const lockedEntry = 2000;
  sm.onSetupDetected({
    id: 'buy_setup', direction: 'BUY', sweepLevel: 1995, sweepTime: Date.now(),
    displacementConfirmed: true, mssLevel: 2005, mssTime: Date.now(),
    lockedEntryPrice: lockedEntry, signalPrice: lockedEntry, 
    virtualSLPrice: lockedEntry - 30, virtualTPPrice: lockedEntry + 30,
    sharedSL: lockedEntry - 30, sharedTP: lockedEntry + 30
  }, engine.getUserSettings());
  
  const setup = sm.getSetup();
  console.log("BUY Entry Levels:", setup?.entryLevels);
  
  // L1: 1998, L2: 1996, L3: 1994, L4: 1992, L5: 1990
  if(setup?.entryLevels?.[0].targetPrice !== 1998) throw new Error("L1 wrong target");
  if(setup?.entryLevels?.[1].targetPrice !== 1996) throw new Error("L2 wrong target");
  
  // Test crossed-level trigger
  // Hit L1
  await engine.onMarketUpdate({
    symbol: 'XAUUSD', bid: 1998, ask: 1998, spreadPoints: 5,
    m1Candles: Array(20).fill({ open: 2000, high: 2000, low: 1998, close: 1998 }), openTradesCount: 0
  });
  
  if (executedOrders.length !== 1) throw new Error("Expected 1 order for L1");
  console.log("Order 1:", executedOrders[0]);
  
  // Hit L2 and L3 in one jump
  await engine.onMarketUpdate({
    symbol: 'XAUUSD', bid: 1993.5, ask: 1993.5, spreadPoints: 5,
    m1Candles: Array(20).fill({ open: 1998, high: 1998, low: 1993.5, close: 1993.5 }), openTradesCount: 1
  });
  
  if (executedOrders.length !== 2) throw new Error("Expected sequentially only L2 executed (max 1 per tick usually, but let's see)");
  console.log("Order 2:", executedOrders[1]);
  
  // Call again to hit L3 since it's already crossed
  await engine.onMarketUpdate({
    symbol: 'XAUUSD', bid: 1993.5, ask: 1993.5, spreadPoints: 5,
    m1Candles: Array(20).fill({ open: 1998, high: 1998, low: 1993.5, close: 1993.5 }), openTradesCount: 2
  });
  
  if (executedOrders.length !== 3) throw new Error("Expected L3 executed");
  console.log("Order 3:", executedOrders[2]);
  
  // Duplicate prevention - hit L3 price again
  await engine.onMarketUpdate({
    symbol: 'XAUUSD', bid: 1994.0, ask: 1994.0, spreadPoints: 5,
    m1Candles: Array(20).fill({ open: 1998, high: 1998, low: 1993.5, close: 1994.0 }), openTradesCount: 3
  });
  if (executedOrders.length !== 3) throw new Error("Expected NO new order for L3 duplicate");
  
  // Hit L4 and L5
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 1990, ask: 1990, spreadPoints: 5, m1Candles: Array(20).fill({ open: 1998, high: 1998, low: 1990, close: 1990 }), openTradesCount: 3 });
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 1990, ask: 1990, spreadPoints: 5, m1Candles: Array(20).fill({ open: 1998, high: 1998, low: 1990, close: 1990 }), openTradesCount: 4 });
  
  if (executedOrders.length !== 5) throw new Error("Expected 5 orders total");
  
  // Hit way below L5
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 1980, ask: 1980, spreadPoints: 5, m1Candles: Array(20).fill({ open: 1998, high: 1998, low: 1980, close: 1980 }), openTradesCount: 5 });
  if (executedOrders.length !== 5) throw new Error("Expected max 5 orders");
  
  console.log("BUY TEST PASSED");
}

async function testScenarioSell() {
  executedOrders = [];
  const engine = new DaRaM1Engine(mockBroker as any, baseSettings);
  engine.start();
  (engine as any).evaluateSafety = () => ({ isSafeToTrade: true });

  const sm = (engine as any).stateMachine as DaRaM1StateMachine;
  const lockedEntry = 2000;
  sm.onSetupDetected({
    id: 'sell_setup', direction: 'SELL', sweepLevel: 2005, sweepTime: Date.now(),
    displacementConfirmed: true, mssLevel: 1995, mssTime: Date.now(),
    lockedEntryPrice: lockedEntry, signalPrice: lockedEntry, 
    virtualSLPrice: lockedEntry + 30, virtualTPPrice: lockedEntry - 30,
    sharedSL: lockedEntry + 30, sharedTP: lockedEntry - 30
  }, engine.getUserSettings());
  
  const setup = sm.getSetup();
  console.log("SELL Entry Levels:", setup?.entryLevels);
  
  // L1: 2002, L2: 2004, L3: 2006, L4: 2008, L5: 2010
  if(setup?.entryLevels?.[0].targetPrice !== 2002) throw new Error("L1 wrong target");
  if(setup?.entryLevels?.[1].targetPrice !== 2004) throw new Error("L2 wrong target");
  
  // Test crossed-level trigger
  // Hit L1
  await engine.onMarketUpdate({
    symbol: 'XAUUSD', bid: 2002, ask: 2002, spreadPoints: 5,
    m1Candles: Array(20).fill({ open: 2000, high: 2002, low: 2000, close: 2002 }), openTradesCount: 0
  });
  
  if (executedOrders.length !== 1) throw new Error("Expected 1 order for L1");
  console.log("Order 1:", executedOrders[0]);
  
  // Hit L2 and L3 in one jump
  await engine.onMarketUpdate({
    symbol: 'XAUUSD', bid: 2006.5, ask: 2006.5, spreadPoints: 5,
    m1Candles: Array(20).fill({ open: 2000, high: 2006.5, low: 2000, close: 2006.5 }), openTradesCount: 1
  });
  
  if (executedOrders.length !== 2) throw new Error("Expected sequentially only L2 executed (max 1 per tick usually, but let's see)");
  console.log("Order 2:", executedOrders[1]);
  
  // Call again to hit L3 since it's already crossed
  await engine.onMarketUpdate({
    symbol: 'XAUUSD', bid: 2006.5, ask: 2006.5, spreadPoints: 5,
    m1Candles: Array(20).fill({ open: 2000, high: 2006.5, low: 2000, close: 2006.5 }), openTradesCount: 2
  });
  
  if (executedOrders.length !== 3) throw new Error("Expected L3 executed");
  console.log("Order 3:", executedOrders[2]);
  
  // Duplicate prevention - hit L3 price again
  await engine.onMarketUpdate({
    symbol: 'XAUUSD', bid: 2006.0, ask: 2006.0, spreadPoints: 5,
    m1Candles: Array(20).fill({ open: 2000, high: 2006.5, low: 2000, close: 2006.0 }), openTradesCount: 3
  });
  if (executedOrders.length !== 3) throw new Error("Expected NO new order for L3 duplicate");
  
  // Hit L4 and L5
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2010, ask: 2010, spreadPoints: 5, m1Candles: Array(20).fill({ open: 2000, high: 2010, low: 2000, close: 2010 }), openTradesCount: 3 });
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2010, ask: 2010, spreadPoints: 5, m1Candles: Array(20).fill({ open: 2000, high: 2010, low: 2000, close: 2010 }), openTradesCount: 4 });
  
  if (executedOrders.length !== 5) throw new Error("Expected 5 orders total");
  
  // Hit way above L5
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 2020, ask: 2020, spreadPoints: 5, m1Candles: Array(20).fill({ open: 2000, high: 2020, low: 2000, close: 2020 }), openTradesCount: 5 });
  if (executedOrders.length !== 5) throw new Error("Expected max 5 orders");
  
  console.log("SELL TEST PASSED");
}

async function runTests() {
  await testScenarioBuy();
  await testScenarioSell();
  console.log("ALL TESTS FINISHED");
}
runTests();
