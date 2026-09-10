import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaPosition } from './src/engines/dara_m1/types';

const trailingEngine = new DaRaProfitTrailing();

function testTrailing(direction: 'BUY' | 'SELL', trailingDistance: number) {
  console.log(`\n--- Test ${direction} | Trailing Distance = ${trailingDistance} ---`);
  
  let position: DaRaPosition = {
    ticket: '123',
    symbol: 'XAUUSD',
    type: direction,
    lot: 0.01,
    openPrice: 100,
    currentPrice: 100,
    sl: direction === 'BUY' ? 90 : 110,
    tp: direction === 'BUY' ? 100.5 : 99.5, // TP is 0.5 away
    originalTp: direction === 'BUY' ? 100.5 : 99.5,
    originalSl: direction === 'BUY' ? 90 : 110,
    openTime: Date.now()
  };

  const settings: any = { trailingEnabled: true, trailingDistance };
  
  const pricesBUY = [100.00, 100.40, 100.50, 101.00, 101.50, 102.00, 103.00, 102.50, 103.50];
  const pricesSELL = [100.00, 99.60, 99.50, 99.00, 98.50, 98.00, 97.00, 97.50, 96.50];
  
  const prices = direction === 'BUY' ? pricesBUY : pricesSELL;

  for (const p of prices) {
    const res = trailingEngine.calculateTrailingSL(position, p, p, settings);
    console.log(`Price: ${p.toFixed(2)} | Config Dist: ${trailingDistance} | Prev SL: ${position.sl} | Calc SL: ${res.newSl || 'none'} | Moved: ${res.shouldModify} | Reason: ${res.reason}`);
    if (res.shouldModify && res.newSl !== undefined) {
      position.sl = res.newSl;
    }
  }
}

testTrailing('BUY', 1.0);
testTrailing('BUY', 2.0);
testTrailing('SELL', 1.0);
testTrailing('SELL', 2.0);

