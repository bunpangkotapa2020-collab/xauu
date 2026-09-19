import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaSetup, DaRaPosition } from './src/engines/dara_m1/types';

const trailingEngine = new DaRaProfitTrailing();

function testContinuousScenario() {
  const setup: DaRaSetup = {
    setupId: 'TEST_CONT', direction: 'BUY', entryTriggerPrice: 100, slDistance: 30, tpDistance: 10,
    virtualTPPrice: 110, sharedTP: 110, maxOpenTrades: 5, activeLevels: 1, status: 'ACTIVE',
    createdAt: Date.now(), updatedAt: Date.now(), l1Price: 100, l2Price: 99, l3Price: 98, l4Price: 97, l5Price: 96
  };
  
  const pos1: DaRaPosition = {
    ticket: 'T_1', symbol: 'XAUUSD', type: 'BUY', lot: 0.01,
    openPrice: 100, currentPrice: 100, sl: 70, tp: 110,
    originalTp: 110, originalSl: 70, openTime: Date.now()
  };
  const pos2: DaRaPosition = {
    ticket: 'T_2', symbol: 'XAUUSD', type: 'BUY', lot: 0.01,
    openPrice: 99, currentPrice: 100, sl: 70, tp: 110,
    originalTp: 110, originalSl: 70, openTime: Date.now()
  };

  const settings: any = { trailingEnabled: true, trailingDistance: 2 };
  
  // 1. Activate trailing at 109.5
  let res = trailingEngine.evaluateSetupTrailing(setup, [pos1, pos2], 109.5, 109.5, settings);
  console.log('Activation:', res.newHiddenSL === 108, 'TP Removed:', res.newTp === 0);

  // 2. Price drops to 109.0 -> Trailing SL should remain 108
  res = trailingEngine.evaluateSetupTrailing(setup, [pos1, pos2], 109.0, 109.0, settings);
  console.log('Price 109.0, SL held:', res.newHiddenSL === 108, 'ShouldModify:', res.shouldModifyBrokerSL === false);

  // 3. Price goes up to 110.5 -> Trailing SL should advance to 108.5
  res = trailingEngine.evaluateSetupTrailing(setup, [pos1, pos2], 110.5, 110.5, settings);
  console.log('Price 110.5, SL advanced:', res.newHiddenSL === 108.5, 'ShouldModify:', res.shouldModifyBrokerSL === true);

  // 4. Price drops to 108.5 -> Basket should close
  res = trailingEngine.evaluateSetupTrailing(setup, [pos1, pos2], 108.5, 108.5, settings);
  console.log('Price 108.5, Close Basket:', res.shouldCloseBasket === true);
}

testContinuousScenario();
