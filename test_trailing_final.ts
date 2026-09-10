import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaPosition } from './src/engines/dara_m1/types';

const trailingEngine = new DaRaProfitTrailing();

function runTest(name: string, direction: 'BUY' | 'SELL', prices: number[], dists: number[]) {
  console.log(`\n==================================================`);
  console.log(`${name} — ${direction}`);
  console.log(`==================================================`);
  
  let position: DaRaPosition = {
    ticket: 'TEST_TICKET',
    symbol: 'XAUUSD',
    type: direction,
    lot: 0.01,
    openPrice: 100,
    currentPrice: 100,
    sl: direction === 'BUY' ? 90 : 110,
    tp: direction === 'BUY' ? 100.5 : 99.5,
    originalTp: direction === 'BUY' ? 100.5 : 99.5,
    originalSl: direction === 'BUY' ? 90 : 110,
    openTime: Date.now()
  };

  for (let i = 0; i < prices.length; i++) {
    const p = prices[i];
    const d = dists[i];
    const settings: any = { trailingEnabled: true, trailingDistance: d };
    
    const prevSl = position.sl;
    const res = trailingEngine.calculateTrailingSL(position, p, p, settings);
    
    if (res.shouldModify && res.newSl !== undefined) {
      position.sl = res.newSl;
    }

    console.log(`Price: ${p.toFixed(2)} | Config Dist: ${d.toFixed(2)} | Prev SL: ${prevSl.toFixed(2)} | Calc/New SL: ${res.newSl !== undefined ? res.newSl.toFixed(2) : 'NONE'} | Moved: ${res.shouldModify} | Cleared TP: ${res.newTp === 0} | Peak/Trough: ${(position.highestPriceSinceOpen || position.lowestPriceSinceOpen || 100).toFixed(2)}`);
  }
}

// TEST 1: BUY, Dist 1
runTest('TEST 1', 'BUY', [100, 101, 102, 103], [1, 1, 1, 1]);

// TEST 2: BUY, Dist 2
runTest('TEST 2', 'BUY', [100, 101, 102, 103, 104], [2, 2, 2, 2, 2]);

// TEST 3A: SELL, Dist 1
runTest('TEST 3A', 'SELL', [100, 99, 98, 97], [1, 1, 1, 1]);

// TEST 3B: SELL, Dist 2
runTest('TEST 3B', 'SELL', [100, 99, 98, 97, 96], [2, 2, 2, 2, 2]);

// TEST 4: PRICE REVERSAL (BUY)
runTest('TEST 4 - REVERSAL BUY', 'BUY', [100, 103, 102.5, 102.1], [1, 1, 1, 1]);

// TEST 4: PRICE REVERSAL (SELL)
runTest('TEST 4 - REVERSAL SELL', 'SELL', [100, 97, 97.5, 97.9], [1, 1, 1, 1]);

// TEST 6: USER SETTING CHANGE
runTest('TEST 6 - SETTING CHANGE', 'BUY', [100, 101, 102, 103], [1, 1, 2, 2]);

