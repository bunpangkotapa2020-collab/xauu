import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine';
import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';
import { DaRaUserSettings } from './src/engines/dara_m1/types';

async function testSell5PositionsTrailing() {
  console.log('====================================================');
  console.log('🔬 TRACING SELL 5 POSITIONS TRAILING SL RUNTIME BEHAVIOR');
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
      const ticket = 'SELL_TICK_' + (openPositionsList.length + 1);
      const pos = {
        ticket,
        symbol: req.symbol,
        type: 'POSITION_TYPE_SELL',
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
  // SELL: L1=2001, L2=2002, L3=2003, L4=2004, L5=2005
  // Initial Shared SL = 2030, TP = 1990
  sm.onSetupDetected({
    id: 'SETUP_SELL_TRAIL_5POS',
    direction: 'SELL',
    sweepLevel: 2010,
    sweepTime: 1000,
    displacementConfirmed: true,
    mssLevel: 2000,
    mssTime: 1010,
    lockedEntryPrice: locked,
    signalPrice: locked,
    virtualSLPrice: 2030,
    virtualTPPrice: 1990,
    sharedSL: 2030,
    sharedTP: 1990
  }, engine.getUserSettings());

  // 1. Trigger all 5 entries sequentially
  const targets = [2001, 2002, 2003, 2004, 2005];
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
  console.log(`[Trace] 5 SELL Positions Opened. Initial SL across all 5:`);
  active.forEach(p => console.log(` - Pos #${p.ticket}: Open=${p.openPrice}, SL=${p.sl}, TP=${p.tp}`));

  // 2. Market price drops into profit to 1995.0 (Trough = 1995.0)
  console.log('\n--- Market drops to 1995.0 (Trough = 1995.0) ---');
  modifiedPositions.length = 0;

  await engine.onMarketUpdate({
    symbol: 'XAUUSD',
    bid: 1994.8,
    ask: 1995.0,
    time: 3000,
    serverTime: 3000,
    spreadPoints: 20,
    openTradesCount: 5,
    m1Candles: []
  });

  console.log(`[Trace] Modifications triggered count: ${modifiedPositions.length}`);
  modifiedPositions.forEach(m => console.log(` - Ticket ${m.ticket}: new SL = ${m.sl}`));

  // Check expected SL: Trough (1995.0) + trailingDistance (2.0) = 1997.0
  const allSlEqual = active.every(p => p.sl === 1997.0);
  console.log(`Are all 5 SELL positions updated to 1997.0? -> ${allSlEqual ? 'YES' : 'NO'}`);

  // 3. Test Monotonicity: Price bounces up to 1996.5
  console.log('\n--- Market bounces up to 1996.5 ---');
  modifiedPositions.length = 0;
  await engine.onMarketUpdate({
    symbol: 'XAUUSD',
    bid: 1996.3,
    ask: 1996.5,
    time: 3010,
    serverTime: 3010,
    spreadPoints: 20,
    openTradesCount: 5,
    m1Candles: []
  });
  console.log(`Modifications on bounce: ${modifiedPositions.length} (Expected 0)`);
  console.log(`Did SELL SL stay locked at 1997.0? -> ${active.every(p => p.sl === 1997.0) ? 'YES' : 'NO'}`);
}

testSell5PositionsTrailing().catch(console.error);
