import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaMarketFeed, DaRaPosition } from './src/engines/dara_m1/types';
import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';

// ---------------------------------------------------------
// 1. MOCK BROKER TO INTERCEPT MT5 COMMANDS
// ---------------------------------------------------------
class RealRuntimeMockBroker {
  public failNextModify = false;
  
  // Track what MT5 actually receives
  public mt5State: Record<string, { sl: number, tp: number }> = {
    '1001': { sl: 4339.000, tp: 4343.073 },
    '1002': { sl: 4339.000, tp: 4343.073 },
    '1003': { sl: 4339.000, tp: 4343.073 }
  };

  async getSymbolInfo(symbol: string) { return { pointSize: 0.01 }; }
  
  async getOpenPositions(symbol: string) { 
    return Object.keys(this.mt5State).map(ticket => ({
      ticket, 
      type: 'BUY', 
      sl: this.mt5State[ticket].sl, 
      tp: this.mt5State[ticket].tp 
    })); 
  }
  
  async sendOrder(order: any) { return { success: true, ticket: 'new' }; }
  async closePosition(ticket: string) { return { success: true }; }
  
  async modifyPosition(ticket: string, newSl: number, newTp?: number) {
    console.log(`\n    [MT5 NETWORK REQUEST] modifyPosition(ticket: ${ticket}, newSL: ${newSl}, newTP: ${newTp})`);
    
    if (this.failNextModify) {
      console.log(`    [MT5 NETWORK RESPONSE] ❌ REJECTED - MetaApi Timeout`);
      return { success: false, error: 'MetaApi timeout / Network failure' };
    }
    
    // Process success
    this.mt5State[ticket].sl = newSl;
    if (newTp !== undefined) this.mt5State[ticket].tp = newTp;
    
    console.log(`    [MT5 NETWORK RESPONSE] ✅ SUCCESS`);
    return { success: true };
  }
}

class MockTelegram {
  async notify(title: string, msg: string) {
    console.log(`\n    [TELEGRAM] ${title}: ${msg}`);
  }
}

// ---------------------------------------------------------
// 2. RUNTIME SIMULATION
// ---------------------------------------------------------
async function runEngineSimulation() {
  console.log("==================================================");
  console.log("ACTUAL RUNTIME ENGINE EXECUTION TEST");
  console.log("User Trailing Distance = 2.0 | Activation = 0.5");
  console.log("==================================================\n");

  const broker = new RealRuntimeMockBroker();
  const telegram = new MockTelegram();
  
  // Initialize ACTUAL production engine
  const engine = new DaRaM1Engine(broker as any, { 
    liveTradingEnabled: true, 
    trailingEnabled: true,
    trailingDistance: 2.0, // Strictly 2.0 as requested
    lotSize: 0.01
  }, telegram as any);
  
  engine.start();

  // Inject active trade state (bypassing M1 scanner to test active trailing)
  const sm = (engine as any).stateMachine;
  sm.currentSetup = {
    id: 'setup_live',
    direction: 'BUY',
    sweepLevel: 4340,
    mssLevel: 4341,
    virtualTPPrice: 4343.073,
    sharedTP: 4343.073,
    trailingState: { activated: false }
  };
  
  sm.activePositions = [
    { ticket: '1001', type: 'BUY', openPrice: 4341.0, lot: 0.01, sl: 4339.0, tp: 4343.073, originalTp: 4343.073, trailingActivated: false },
    { ticket: '1002', type: 'BUY', openPrice: 4340.5, lot: 0.01, sl: 4339.0, tp: 4343.073, originalTp: 4343.073, trailingActivated: false },
    { ticket: '1003', type: 'BUY', openPrice: 4340.0, lot: 0.01, sl: 4339.0, tp: 4343.073, originalTp: 4343.073, trailingActivated: false }
  ];
  (engine as any).closedTicketsSet.clear();

  // Create LIVE feed
  const createFeed = (bid: number): DaRaMarketFeed => ({
    symbol: 'XAUUSD', bid, ask: bid + 0.1, time: Date.now(), serverTime: Date.now(), spreadPoints: 10, openTradesCount: 3, m1Candles: []
  });

  console.log("==================================================");
  console.log("TICK 1: PRICE REACHES ACTIVATION BUT BROKER FAILS");
  console.log("==================================================");
  // Bid = 4342.856 (Activation is 4343.073 - 0.5 = 4342.573)
  broker.failNextModify = true; // Force MetaApi to drop the connection
  await engine.onMarketUpdate(createFeed(4342.856));
  
  console.log("\n[ASSERTION] EA Local Trailing State Activated?", sm.currentSetup.trailingState.activated);
  console.log("[ASSERTION] MT5 Pos #1 TP:", broker.mt5State['1001'].tp, "| MT5 Pos #1 SL:", broker.mt5State['1001'].sl);


  console.log("\n==================================================");
  console.log("TICK 2: PRICE STILL AT ACTIVATION, BROKER SUCCEEDS");
  console.log("==================================================");
  // Bid = 4342.856
  broker.failNextModify = false; // Connection restored
  await engine.onMarketUpdate(createFeed(4342.856));
  
  console.log("\n[ASSERTION] EA Local Trailing State Activated?", sm.currentSetup.trailingState.activated);
  console.log("[ASSERTION] MT5 Pos #1 TP:", broker.mt5State['1001'].tp, " (Expected 0)");
  console.log("[ASSERTION] MT5 Pos #1 SL:", broker.mt5State['1001'].sl, " (Expected 4341.073)");
  console.log("[ASSERTION] MT5 Pos #3 TP:", broker.mt5State['1003'].tp, " (Expected 0)");
  console.log("[ASSERTION] MT5 Pos #3 SL:", broker.mt5State['1003'].sl, " (Expected 4341.073)");


  console.log("\n==================================================");
  console.log("TICK 3: CONTINUOUS TRAILING (PRICE INCREASES)");
  console.log("==================================================");
  // Bid = 4344.000
  await engine.onMarketUpdate(createFeed(4344.000));
  
  console.log("\n[ASSERTION] EA Local Trailing State Activated?", sm.currentSetup.trailingState.activated);
  console.log("[ASSERTION] MT5 Pos #1 TP:", broker.mt5State['1001'].tp, " (Expected 0)");
  console.log("[ASSERTION] MT5 Pos #1 SL:", broker.mt5State['1001'].sl, " (Expected 4342)");
}

runEngineSimulation().catch(console.error);
