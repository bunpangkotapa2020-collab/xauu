import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaSetup, DaRaPosition } from './src/engines/dara_m1/types';

const trailingEngine = new DaRaProfitTrailing();

function testExactScenario(name: string, direction: 'BUY' | 'SELL', tp: number, tickPrice: number, distance: number, expectedSl: number) {
  const setup: DaRaSetup = {
    setupId: 'TEST_EXACT', direction, entryTriggerPrice: 100, slDistance: 30, tpDistance: Math.abs(tp - 100),
    virtualTPPrice: tp, sharedTP: tp, maxOpenTrades: 5, activeLevels: 1, status: 'ACTIVE',
    createdAt: Date.now(), updatedAt: Date.now(), l1Price: 100, l2Price: 99, l3Price: 98, l4Price: 97, l5Price: 96
  };
  
  const pos: DaRaPosition = {
    ticket: 'T_1', symbol: 'XAUUSD', type: direction, lot: 0.01,
    openPrice: 100, currentPrice: 100, sl: direction === 'BUY' ? 70 : 130, tp,
    originalTp: tp, originalSl: direction === 'BUY' ? 70 : 130, openTime: Date.now()
  };

  const settings: any = { trailingEnabled: true, trailingDistance: distance };
  
  // Test before activation (0.1 away from activation)
  const preTick = direction === 'BUY' ? tickPrice - 0.1 : tickPrice + 0.1;
  let res = trailingEngine.evaluateSetupTrailing(setup, [pos], preTick, preTick, settings);
  if (res.activatedThisTick) {
    console.error(`❌ ${name} FAILED: Activated too early at ${preTick}`);
    return;
  }

  // Test exactly at activation
  res = trailingEngine.evaluateSetupTrailing(setup, [pos], tickPrice, tickPrice, settings);
  
  if (res.activatedThisTick && res.newHiddenSL === expectedSl) {
    console.log(`✅ ${name} PASS | TP: ${tp} | Act Price: ${tickPrice} | Dist: ${distance} | Initial SL: ${res.newHiddenSL}`);
  } else {
    console.error(`❌ ${name} FAILED | Expected SL: ${expectedSl} | Got SL: ${res.newHiddenSL} | Activated: ${res.activatedThisTick}`);
  }
}

console.log('--- RUNNING EXACT SCENARIO TESTS ---');
testExactScenario('BUY  (Dist 3)', 'BUY',  100, 99.5,  3, 97);
testExactScenario('BUY  (Dist 2)', 'BUY',  100, 99.5,  2, 98);
testExactScenario('SELL (Dist 3)', 'SELL', 100, 100.5, 3, 103);
testExactScenario('SELL (Dist 2)', 'SELL', 100, 100.5, 2, 102);
