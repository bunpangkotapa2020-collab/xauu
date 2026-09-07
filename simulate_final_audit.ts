import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine.js';
import { DaRaM1Strategy } from './src/engines/dara_m1/DaRaM1Strategy.js';
import { DaRaUserSettings, DaRaMarketFeed, DaRaCandle } from './src/engines/dara_m1/types.js';

// Stub Strategy
DaRaM1Strategy.prototype.scanForSetup = (candles: any, settings: any) => {
  if ((global as any).forceSetup === 'BUY') {
    (global as any).forceSetup = null;
    const p = 100;
    return {
      id: `DARA_BUY_${Date.now()}`,
      direction: 'BUY',
      sweepLevel: p-5, sweepTime: Date.now(), displacementConfirmed: true,
      mssLevel: p, mssTime: Date.now(),
      lockedEntryPrice: p, virtualSLPrice: p - settings.slDistance, virtualTPPrice: p + settings.tpDistance,
      userSlDistance: settings.slDistance, userTpDistance: settings.tpDistance,
      createdAt: Date.now(), status: 'PENDING_ENTRY'
    };
  }
  if ((global as any).forceSetup === 'SELL') {
    (global as any).forceSetup = null;
    const p = 100;
    return {
      id: `DARA_SELL_${Date.now()}`,
      direction: 'SELL',
      sweepLevel: p+5, sweepTime: Date.now(), displacementConfirmed: true,
      mssLevel: p, mssTime: Date.now(),
      lockedEntryPrice: p, virtualSLPrice: p + settings.slDistance, virtualTPPrice: p - settings.tpDistance,
      userSlDistance: settings.slDistance, userTpDistance: settings.tpDistance,
      createdAt: Date.now(), status: 'PENDING_ENTRY'
    };
  }
  return null;
};

// Mocks
const userSettings: DaRaUserSettings = {
  lotSize: 0.01, slDistance: 10, tpDistance: 10, dailyLossLimit: 100,
  maxOpenTrades: 5, maxConsecutiveSL: 5, cooldownMinutes: 0,
  maxSpreadPoints: 50, newsFilterEnabled: false, newsMinsBefore: 0, newsMinsAfter: 0,
  trailingEnabled: true
};

const openPositions: any[] = [];
let ticketCounter = 1000;

const mockBroker: any = {
  sendOrder: async (order: any) => {
    const t = ticketCounter++;
    const pos = { ticket: t, type: order.type, lot: order.lot, openPrice: order.openPrice, sl: order.sl, tp: order.tp, currentPrice: order.openPrice, openTime: Date.now() };
    openPositions.push(pos);
    return { success: true, ticket: t, position: pos };
  },
  modifyPosition: async (ticket: number, newSl: number, newTp: number) => {
    const p = openPositions.find(p => p.ticket === ticket);
    if(p) { p.sl = newSl; if(newTp) p.tp = newTp; }
    return { success: true };
  },
  getOpenPositions: async () => openPositions,
  getSymbolInfo: async () => ({ pointSize: 1.0 }),
  getClosedDeal: async () => ({ found: false })
};

const mockTelegram: any = { notify: async (title:string, msg:string) => { console.log(`[TELEGRAM] ${title} | ${msg.replace(/\n/g, ' ')}`); } };

const engine = new DaRaM1Engine(mockBroker, userSettings, mockTelegram);
(engine as any).cachedPointSize = 1.0;
engine.start();

const mockCandles = Array(20).fill({time:Date.now(), open: 100, high: 100, low: 100, close: 100});

async function runAudit() {
  console.log("\n=== FINAL AUDIT SIMULATION ===");

  // ---------------------------------------------------------
  // 1. BUY SETUP TEST
  // ---------------------------------------------------------
  console.log("\n--- TEST 1: BUY SETUP & SEQUENTIAL 5 LEVELS ---");
  (global as any).forceSetup = 'BUY';
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 104, ask: 104.1, spreadPoints: 10, serverTime: Date.now(), m1Candles: mockCandles, openTradesCount: openPositions.length });
  
  let setup = (engine as any).stateMachine.getSetup();
  console.log("Locked Entry:", setup?.lockedEntryPrice);
  console.log("Entry Levels Targets:", setup?.entryLevels.map((e:any)=>e.targetPrice).join(', '));
  
  let currentPrice = 100; // Starting near locked entry
  for(let i=1; i<=6; i++) {
    currentPrice -= 1; // 99, 98, 97, 96, 95, 94(P6 attempt)
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: currentPrice, ask: currentPrice+0.1, spreadPoints: 10, serverTime: Date.now(), m1Candles: mockCandles, openTradesCount: openPositions.length });
  }

  // Duplicate attempt at 95
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 95, ask: 95.1, spreadPoints: 10, serverTime: Date.now(), m1Candles: mockCandles, openTradesCount: openPositions.length });
  
  console.log("\n--- BUY TEST RESULTS ---");
  const buyActive = (engine as any).stateMachine.getActivePositions();
  console.log(`Total Positions Opened: ${buyActive.length} (Expected: 5)`);
  buyActive.forEach((p:any, i:number) => {
    console.log(`Pos #${i+1} - Open: ${p.openPrice}, SL: ${p.sl}, TP: ${p.tp}`);
  });

  // Trailing check
  console.log("\n--- TEST 2: BUY TRAILING ---");
  console.log("Market pumps to 105 (simulating trailing)");
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 105, ask: 105.1, spreadPoints: 10, serverTime: Date.now(), m1Candles: mockCandles, openTradesCount: openPositions.length });
  buyActive.forEach((p:any, i:number) => {
    console.log(`Pos #${i+1} Trailing SL updated to: ${p.sl}`);
  });

  // Let's explicitly finish the trade by hitting TP (110)
  console.log("\nMarket hits TP 110 to clean state");
  await engine.handlePositionClosed(1000, 'TP_HIT');
  await engine.handlePositionClosed(1001, 'TP_HIT');
  await engine.handlePositionClosed(1002, 'TP_HIT');
  await engine.handlePositionClosed(1003, 'TP_HIT');
  await engine.handlePositionClosed(1004, 'TP_HIT');
  openPositions.length = 0; // manually clean mock
  
  // ---------------------------------------------------------
  // 3. SELL SETUP TEST
  // ---------------------------------------------------------
  console.log("\n--- TEST 3: SELL SETUP & SEQUENTIAL 5 LEVELS ---");
  (global as any).forceSetup = 'SELL';
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 96, ask: 96.1, spreadPoints: 10, serverTime: Date.now(), m1Candles: mockCandles, openTradesCount: openPositions.length });
  
  setup = (engine as any).stateMachine.getSetup();
  console.log("Locked Entry:", setup?.lockedEntryPrice);
  console.log("Entry Levels Targets:", setup?.entryLevels?.map((e:any)=>e.targetPrice).join(', '));
  
  currentPrice = 100;
  for(let i=1; i<=6; i++) {
    currentPrice += 1; // 101, 102, 103, 104, 105, 106(P6 attempt)
    await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: currentPrice, ask: currentPrice+0.1, spreadPoints: 10, serverTime: Date.now(), m1Candles: mockCandles, openTradesCount: openPositions.length });
  }

  console.log("\n--- SELL TEST RESULTS ---");
  const sellActive = (engine as any).stateMachine.getActivePositions();
  console.log(`Total Positions Opened: ${sellActive.length} (Expected: 5)`);
  sellActive.forEach((p:any, i:number) => {
    console.log(`Pos #${i+1} - Open: ${p.openPrice}, SL: ${p.sl}, TP: ${p.tp}`);
  });

  // Let's explicitly finish the trade
  await engine.handlePositionClosed(1005, 'TP_HIT');
  await engine.handlePositionClosed(1006, 'TP_HIT');
  await engine.handlePositionClosed(1007, 'TP_HIT');
  await engine.handlePositionClosed(1008, 'TP_HIT');
  await engine.handlePositionClosed(1009, 'TP_HIT');
  openPositions.length = 0;

  // ---------------------------------------------------------
  // 4. SAFETY BLOCK TEST
  // ---------------------------------------------------------
  console.log("\n--- TEST 4: SAFETY BLOCK (Spread) ---");
  (global as any).forceSetup = 'BUY';
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 104, ask: 104.1, spreadPoints: 10, serverTime: Date.now(), m1Candles: mockCandles, openTradesCount: openPositions.length });
  console.log("Market drops to 99, but Spread is 100 (Max 50)");
  await engine.onMarketUpdate({ symbol: 'XAUUSD', bid: 99, ask: 99.1, spreadPoints: 100, serverTime: Date.now(), m1Candles: mockCandles, openTradesCount: openPositions.length });
  const safeActive = (engine as any).stateMachine.getActivePositions();
  console.log(`Positions opened: ${safeActive.length} (Expected: 0)`);
}

runAudit();
