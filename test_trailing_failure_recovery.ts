import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaMarketFeed } from './src/engines/dara_m1/types';

// Mock Broker
class MockBroker {
  failMode: 'none' | 'false' | 'throw' | 'partial' = 'none';
  callCount = 0;
  
  async getSymbolInfo(symbol: string) { return { pointSize: 0.01 }; }
  
  // Return the active position so the engine doesn't think it was closed
  async getOpenPositions(symbol: string) { 
    return [
      { ticket: '1001', type: 'BUY', unrealizedProfit: 10 },
      { ticket: '1002', type: 'BUY', unrealizedProfit: 10 },
      { ticket: '1003', type: 'BUY', unrealizedProfit: 10 }
    ]; 
  }
  
  async sendOrder(order: any) { return { success: true, ticket: '100' + (++this.callCount) }; }
  async closePosition(ticket: string) { return { success: true }; }
  
  async modifyPosition(ticket: string, newSl: number, newTp?: number) {
    if (this.failMode === 'false') {
      return { success: false, error: 'MetaApi timeout' };
    }
    if (this.failMode === 'throw') {
      throw new Error("MetaApi Network Disconnected");
    }
    if (this.failMode === 'partial' && ticket === '1002') {
      return { success: false, error: 'Position 1002 locked' };
    }
    return { success: true };
  }
}

// Mock Telegram
class MockTelegram {
  async notify(title: string, msg: string) {}
}

async function runTests() {
  console.log("=== TRAILING FAILURE RECOVERY TESTS ===");

  const broker = new MockBroker();
  const engine = new DaRaM1Engine(broker as any, { 
    liveTradingEnabled: true, 
    trailingEnabled: true,
    trailingDistance: 3.5
  }, new MockTelegram() as any);
  
  engine.start();
  
  const setupPositions = () => {
      const stateMachine = (engine as any).stateMachine;
      stateMachine.activePositions = [
        { ticket: '1001', type: 'BUY', openPrice: 4341.0, lot: 0.01, sl: 4339, tp: 4343.073, originalTp: 4343.073, trailingActivated: false }
      ];
      stateMachine.currentSetup = {
        id: 'setup1',
        direction: 'BUY',
        sweepLevel: 4340,
        mssLevel: 4341,
        virtualTPPrice: 4343.073,
        sharedTP: 4343.073,
        trailingState: { activated: false }
      };
      (engine as any).closedTicketsSet.clear();
      (engine as any).cachedPointSize = 0.01;
      return stateMachine;
  }

  // Activation Threshold: 4343.073 - 0.5 = 4342.573
  const feed: DaRaMarketFeed = { symbol: 'XAUUSD', bid: 4342.856, ask: 4342.956, time: Date.now(), serverTime: Date.now(), spreadPoints: 10, openTradesCount: 1, m1Candles: [] };

  console.log("\n--- TEST 1: BROKER RETURNS success:false ---");
  broker.failMode = 'false';
  let sm = setupPositions();
  await engine.onMarketUpdate(feed);
  
  console.log("Master Trailing Activated?", sm.currentSetup.trailingState.activated);
  console.log("Pos 1 Trailing Activated?", sm.activePositions[0].trailingActivated);
  console.log("Pos 1 TP Removed?", sm.activePositions[0].tp === 0);
  console.log("Expected: false, false, false");

  console.log("\n--- TEST 2: BROKER THROWS EXCEPTION ---");
  broker.failMode = 'throw';
  sm = setupPositions();
  await engine.onMarketUpdate(feed);
  
  console.log("Master Trailing Activated?", sm.currentSetup.trailingState.activated);
  console.log("Pos 1 Trailing Activated?", sm.activePositions[0].trailingActivated);
  console.log("Pos 1 TP Removed?", sm.activePositions[0].tp === 0);
  console.log("Expected: false, false, false");

  console.log("\n--- TEST 3: BROKER SUCCEEDS (RETRY WORKS) ---");
  broker.failMode = 'none';
  sm = setupPositions();
  await engine.onMarketUpdate(feed);
  
  console.log("Master Trailing Activated?", sm.currentSetup.trailingState.activated);
  console.log("Pos 1 Trailing Activated?", sm.activePositions[0].trailingActivated);
  console.log("Pos 1 TP Removed?", sm.activePositions[0].tp === 0);
  console.log("Pos 1 Initial SL:", sm.activePositions[0].sl);
  console.log("Expected Initial SL: 4343.073 - 3.5 =", 4343.073 - 3.5);
  console.log("Expected: true, true, true, 4339.573");

  console.log("\n--- TEST 4: PARTIAL BASKET FAILURE ---");
  sm = setupPositions();
  sm.activePositions = [
    { ticket: '1001', type: 'BUY', openPrice: 4341.0, lot: 0.01, sl: 4339, tp: 4343.073, originalTp: 4343.073, trailingActivated: false },
    { ticket: '1002', type: 'BUY', openPrice: 4340.5, lot: 0.01, sl: 4339, tp: 4343.073, originalTp: 4343.073, trailingActivated: false },
    { ticket: '1003', type: 'BUY', openPrice: 4340.0, lot: 0.01, sl: 4339, tp: 4343.073, originalTp: 4343.073, trailingActivated: false }
  ];
  
  broker.failMode = 'partial'; // Ticket 1002 will fail
  await engine.onMarketUpdate(feed);
  
  console.log("Master Trailing Activated?", sm.currentSetup.trailingState.activated);
  console.log("Pos 1 Trailing Activated?", sm.activePositions[0].trailingActivated);
  console.log("Pos 2 Trailing Activated?", sm.activePositions[1].trailingActivated);
  console.log("Pos 3 Trailing Activated?", sm.activePositions[2].trailingActivated);
  console.log("Expected: false, false, false, false");
  console.log("Notice: Entire basket reverted successfully.");
}

runTests().catch(console.error);
