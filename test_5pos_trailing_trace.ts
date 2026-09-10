import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';
import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaPosition, DaRaUserSettings } from './src/engines/dara_m1/types';

async function test5PositionsTrailing() {
  console.log('====================================================');
  console.log('🔬 TRACING 5 POSITIONS TRAILING SL RUNTIME BEHAVIOR');
  console.log('====================================================');

  const settings: DaRaUserSettings = {
    lotSize: 0.01,
    slDistance: 30.0,
    tpDistance: 10.0,
    dailyLossLimit: 2000,
    maxOpenTrades: 5,
    maxConsecutiveSL: 3,
    cooldownMinutes: 15,
    maxSpreadPoints: 25,
    newsFilterEnabled: false,
    newsMinsBefore: 0,
    newsMinsAfter: 0,
    trailingEnabled: true,
    trailingDistance: 2.0, // user setting trailing distance = 2.0 pts
    entryDistance: 1.0,
    liveTradingEnabled: true
  };

  const modifiedPositions: { ticket: string; sl: number; tp: number }[] = [];
  const openPositionsList: any[] = [];

  const mockBroker = {
    getSymbolInfo: async () => ({ pointSize: 0.01 }),
    sendOrder: async (req: any) => {
      const ticket = 'TICK_' + (openPositionsList.length + 1);
      const pos = {
        ticket,
        symbol: req.symbol,
        type: req.type === 'BUY' ? 'POSITION_TYPE_BUY' : 'POSITION_TYPE_SELL',
        volume: req.lot,
        openPrice: req.openPrice,
        currentPrice: req.openPrice,
        stopLoss: req.sl,
        takeProfit: req.tp,
        profit: 0
      };
      openPositionsList.push(pos);
      return { success: true, ticket };
    },
    getOpenPositions: async () => openPositionsList,
    modifyPosition: async (ticket: string | number, sl: number, tp: number) => {
      modifiedPositions.push({ ticket: String(ticket), sl, tp });
      const p = openPositionsList.find(pos => pos.ticket === ticket);
      if (p) {
        p.stopLoss = sl;
        p.takeProfit = tp;
      }
      return { success: true };
    }
  };

  const engine = new DaRaM1Engine(mockBroker as any, settings);
  engine.start();
  (engine as any).cachedPointSize = 0.01;

  const sm = (engine as any).stateMachine as DaRaM1StateMachine;
  const locked = 2000.0;
  // BUY: L1=1999, L2=1998, L3=1997, L4=1996, L5=1995
  // Initial Shared SL = 1970, TP = 2010
  sm.onSetupDetected({
    id: 'SETUP_TRAIL_5POS',
    direction: 'BUY',
    sweepLevel: 1990,
    sweepTime: 1000,
    displacementConfirmed: true,
    mssLevel: 2000,
    mssTime: 1010,
    lockedEntryPrice: locked,
    signalPrice: locked,
    virtualSLPrice: 1970,
    virtualTPPrice: 2010,
    sharedSL: 1970,
    sharedTP: 2010
  }, engine.getUserSettings());

  // 1. Trigger all 5 entries sequentially
  const targets = [1999, 1998, 1997, 1996, 1995];
  for (let i = 0; i < 5; i++) {
    await engine.onMarketUpdate({
      symbol: 'XAUUSD',
      bid: targets[i],
      ask: targets[i] + 0.2,
      time: 2000 + i * 10,
      serverTime: 2000 + i * 10,
      spreadPoints: 20,
      openTradesCount: i,
      m1Candles: []
    });
  }

  const active = sm.getActivePositions();
  console.log(`[Trace] 5 Positions Opened. Initial SL across all 5:`);
  active.forEach(p => console.log(` - Pos #${p.ticket}: Open=${p.openPrice}, SL=${p.sl}, TP=${p.tp}`));

  // 2. Market price surges into profit past Locked Entry (2000) to 2005
  console.log('\n--- Market surges to 2005.0 (Peak = 2005.0) ---');
  modifiedPositions.length = 0; // reset log

  await engine.onMarketUpdate({
    symbol: 'XAUUSD',
    bid: 2005.0,
    ask: 2005.2,
    time: 3000,
    serverTime: 3000,
    spreadPoints: 20,
    openTradesCount: 5,
    m1Candles: []
  });

  console.log(`[Trace] Modifications triggered count: ${modifiedPositions.length}`);
  modifiedPositions.forEach(m => console.log(` - Ticket ${m.ticket}: new SL = ${m.sl}, new TP = ${m.tp}`));

  // Verify all 5 positions have the identical SL level
  console.log('\n[Trace] Active Positions SL after 2005 surge:');
  active.forEach(p => console.log(` - Pos #${p.ticket}: SL = ${p.sl} (Open = ${p.openPrice})`));

  const allSlEqual = active.every(p => p.sl === active[0].sl);
  console.log(`\nAre all 5 positions updated to identical SL? -> ${allSlEqual ? 'YES' : 'NO'}`);
  console.log(`Expected SL = Peak (2005) - trailingDistance (2.0) = 2003.0`);
  console.log(`Actual SL on Pos #1: ${active[0].sl}`);

  // 3. Test Monotonicity: Price pulls back to 2003.5
  console.log('\n--- Market pulls back to 2003.5 ---');
  modifiedPositions.length = 0;
  await engine.onMarketUpdate({
    symbol: 'XAUUSD',
    bid: 2003.5,
    ask: 2003.7,
    time: 3010,
    serverTime: 3010,
    spreadPoints: 20,
    openTradesCount: 5,
    m1Candles: []
  });
  console.log(`Modifications on pullback: ${modifiedPositions.length} (Expected 0)`);
  console.log(`Did SL stay locked at 2003.0? -> ${active.every(p => p.sl === 2003.0) ? 'YES' : 'NO'}`);

  // 4. Test Further Trail: Price pushes higher to 2008.0
  console.log('\n--- Market pushes higher to 2008.0 ---');
  modifiedPositions.length = 0;
  await engine.onMarketUpdate({
    symbol: 'XAUUSD',
    bid: 2008.0,
    ask: 2008.2,
    time: 3020,
    serverTime: 3020,
    spreadPoints: 20,
    openTradesCount: 5,
    m1Candles: []
  });
  console.log(`Modifications on higher peak: ${modifiedPositions.length}`);
  modifiedPositions.forEach(m => console.log(` - Ticket ${m.ticket}: new SL = ${m.sl}`));
  console.log(`Expected SL = 2008 - 2.0 = 2006.0`);
  console.log(`Actual SL across all 5: ${active.map(p => p.sl).join(', ')}`);

  // 5. Test Basket Closure on Trailing SL hit
  console.log('\n--- Market drops to 2005.8 (Hits Trailing SL 2006.0) ---');
  openPositionsList.length = 0; // Broker closes all positions because price hit 2006.0 SL
  (mockBroker as any).getClosedDeal = async (ticket: any) => ({
    found: true,
    profit: 35.0,
    price: 2006.0,
    reason: 'DEAL_REASON_SL',
    comment: '[sl 2006.0]'
  });

  await engine.onMarketUpdate({
    symbol: 'XAUUSD',
    bid: 2005.8,
    ask: 2006.0,
    time: 3050,
    serverTime: 3050,
    spreadPoints: 20,
    openTradesCount: 0,
    m1Candles: []
  });

  console.log(`Engine State after Trailing SL hit: ${sm.getState()} (Expected SCANNING)`);
  console.log(`Setup after Trailing SL hit: ${sm.getSetup()} (Expected null)`);
  console.log(`Active Positions: ${sm.getActivePositions().length} (Expected 0)`);
  console.log(`Scan Baseline Time updated: ${(engine as any).strategy.getScanBaselineTime()}`);
}

test5PositionsTrailing().catch(console.error);
