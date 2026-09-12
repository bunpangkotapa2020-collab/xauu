import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaSetup, DaRaPosition } from './src/engines/dara_m1/types';

const trailingEngine = new DaRaProfitTrailing();

function runBasketTest(name: string, direction: 'BUY' | 'SELL', tp: number, prices: number[], trailingDistance: number) {
  console.log(`\n==================================================`);
  console.log(`BASKET TEST: ${name} — ${direction}`);
  console.log(`TP: ${tp}, Trailing Distance: ${trailingDistance}`);
  console.log(`==================================================`);

  const setup: DaRaSetup = {
    setupId: 'TEST_SETUP_1',
    direction,
    entryTriggerPrice: 100,
    slDistance: 30,
    tpDistance: direction === 'BUY' ? (tp - 100) : (100 - tp),
    virtualTPPrice: tp,
    sharedTP: tp,
    maxOpenTrades: 5,
    l1Price: 100,
    l2Price: 99,
    l3Price: 98,
    l4Price: 97,
    l5Price: 96,
    activeLevels: 1,
    status: 'ACTIVE',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const pos: DaRaPosition = {
    ticket: 'TEST_TICKET_1',
    symbol: 'XAUUSD',
    type: direction,
    lot: 0.01,
    openPrice: 100,
    currentPrice: 100,
    sl: direction === 'BUY' ? 70 : 130,
    tp: tp,
    originalTp: tp,
    originalSl: direction === 'BUY' ? 70 : 130,
    openTime: Date.now()
  };

  const settings: any = { trailingEnabled: true, trailingDistance };

  for (const p of prices) {
    const res = trailingEngine.evaluateSetupTrailing(setup, [pos], p, p, settings);
    const hiddenSl = setup.trailingState?.currentHiddenSL;
    console.log(`Price: ${p.toFixed(2)} | Activated this tick: ${res.activatedThisTick} | Modify Broker SL: ${res.shouldModifyBrokerSL} | Hidden SL: ${hiddenSl !== undefined ? hiddenSl.toFixed(2) : 'NONE'} | New TP: ${res.newTp} | Close Basket: ${res.shouldCloseBasket} | Reason: ${res.reason}`);
  }
}

// TEST 1: BUY Activation at TP - 0.5
// TP = 110. Activation = 109.5. Distance = 3. Initial SL = 107
runBasketTest('TEST 1: BUY Activation', 'BUY', 110, [109, 109.4, 109.5, 110, 111, 109, 108], 3);

// TEST 2: SELL Activation at TP + 0.5
// TP = 90. Activation = 90.5. Distance = 3. Initial SL = 93
runBasketTest('TEST 2: SELL Activation', 'SELL', 90, [91, 90.6, 90.5, 90, 89, 92, 93], 3);

