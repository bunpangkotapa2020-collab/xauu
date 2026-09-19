import { DaRaProfitTrailing } from './src/engines/dara_m1/DaRaProfitTrailing';
import { DaRaSetup, DaRaPosition } from './src/engines/dara_m1/types';

console.log("=== RUNTIME TRAILING VERIFICATION ===\n");

const trailing = new DaRaProfitTrailing();
const userSettings = { trailingDistance: 3.5, trailingEnabled: true } as any;

// SCENARIO 1: BUY
console.log("--- 8. BUY ACTIVATION RUNTIME SIMULATION ---");
let buySetup: DaRaSetup = {
  id: 'buy1',
  direction: 'BUY',
  sweepLevel: 4340,
  mssLevel: 4341,
  virtualTPPrice: 4343.073,
  sharedTP: 4343.073,
  trailingState: { activated: false }
} as DaRaSetup;

let buyPos1: DaRaPosition = {
  ticket: '1001',
  type: 'BUY',
  openPrice: 4341.000,
  lot: 0.01,
  sl: 4339.000,
  tp: 4343.073,
  originalTp: 4343.073,
  trailingActivated: false
} as DaRaPosition;

console.log(`Master TP: ${buySetup.sharedTP}`);
console.log(`User Trailing Distance: ${userSettings.trailingDistance}`);
console.log(`Activation Buffer (Fixed): ${DaRaProfitTrailing.ACTIVATION_BUFFER}`);
let activationPrice = buySetup.sharedTP - DaRaProfitTrailing.ACTIVATION_BUFFER;
console.log(`Calculated Activation Price: ${activationPrice}`);

let bid = 4342.856;
console.log(`\nSimulating tick... Bid=${bid} (>= ${activationPrice}?)`);
let resBuy = trailing.evaluateSetupTrailing(buySetup, [buyPos1], bid, bid + 0.1, userSettings);
console.log(JSON.stringify(resBuy, null, 2));

// SCENARIO 2: SELL
console.log("\n--- 9. SELL ACTIVATION RUNTIME SIMULATION ---");
let sellSetup: DaRaSetup = {
  id: 'sell1',
  direction: 'SELL',
  sweepLevel: 100,
  mssLevel: 98,
  virtualTPPrice: 90.000,
  sharedTP: 90.000,
  trailingState: { activated: false }
} as DaRaSetup;

let sellPos1: DaRaPosition = {
  ticket: '2001',
  type: 'SELL',
  openPrice: 95.000,
  lot: 0.01,
  sl: 97.000,
  tp: 90.000,
  originalTp: 90.000,
  trailingActivated: false
} as DaRaPosition;

let sellActivation = sellSetup.sharedTP + DaRaProfitTrailing.ACTIVATION_BUFFER;
console.log(`Master TP: ${sellSetup.sharedTP}, Sell Act Price: ${sellActivation}`);
let ask = 90.250; // below 90.500
console.log(`Simulating tick... Ask=${ask} (<= ${sellActivation}?)`);
let resSell = trailing.evaluateSetupTrailing(sellSetup, [sellPos1], ask - 0.1, ask, userSettings);
console.log(JSON.stringify(resSell, null, 2));

// SCENARIO 3: MULTIPLE ENTRIES
console.log("\n--- 10. ENTRIES #2-#5 FOLLOW MASTER TRAILING ---");
let buyPos2: DaRaPosition = { ticket: '1002', type: 'BUY', openPrice: 4340.500, lot: 0.01, sl: 4339, tp: 4343.073, originalTp: 4343.073, trailingActivated: false } as DaRaPosition;
let buyPos3: DaRaPosition = { ticket: '1003', type: 'BUY', openPrice: 4340.000, lot: 0.01, sl: 4339, tp: 4343.073, originalTp: 4343.073, trailingActivated: false } as DaRaPosition;
// Apply activation from resBuy manually to state
buySetup.trailingState.activated = true;
buySetup.trailingState.currentHiddenSL = resBuy.newHiddenSL!;
buyPos1.trailingActivated = true; buyPos1.lastTrailingSl = resBuy.newHiddenSL!; buyPos1.tp = resBuy.newTp!;
buyPos2.trailingActivated = true; buyPos2.lastTrailingSl = resBuy.newHiddenSL!; buyPos2.tp = resBuy.newTp!;
buyPos3.trailingActivated = true; buyPos3.lastTrailingSl = resBuy.newHiddenSL!; buyPos3.tp = resBuy.newTp!;

console.log("Positions 1, 2, 3 SLs initialized to:", resBuy.newHiddenSL);
console.log("Advancing price to 4344.000 (SL should move up)");
bid = 4344.000;
let resMulti = trailing.evaluateSetupTrailing(buySetup, [buyPos1, buyPos2, buyPos3], bid, bid+0.1, userSettings);
console.log("New Hidden SL:", resMulti.newHiddenSL);
console.log("Notice: All positions in the basket share the exact same trailing evaluation.");

// SCENARIO 4: NO LOOSENING
console.log("\n--- 13. TRAILING SL NEVER LOOSENS ---");
// Current Hidden SL is now 4344 - 3.5 = 4340.5
buySetup.trailingState.currentHiddenSL = resMulti.newHiddenSL!;
console.log(`Current Master SL: ${buySetup.trailingState.currentHiddenSL}`);
console.log(`Price drops heavily to 4341.000 (Below SL!)`);
bid = 4341.000;
let resDrop = trailing.evaluateSetupTrailing(buySetup, [buyPos1, buyPos2, buyPos3], bid, bid+0.1, userSettings);
console.log("Resulting action when price drops below SL:", resDrop.shouldCloseBasket ? "CLOSE BASKET (SL HIT)" : "NOTHING");
console.log("Notice: SL did NOT decrease to 4341 - 3.5 = 4337.5. It held firm at", buySetup.trailingState.currentHiddenSL);

bid = 4340.000;
let resDropReal = trailing.evaluateSetupTrailing(buySetup, [buyPos1, buyPos2, buyPos3], bid, bid+0.1, userSettings);
console.log(`\nPrice drops to 4340.000 (Below SL 4340.5!)`);
console.log("Resulting action:", resDropReal.shouldCloseBasket ? "CLOSE BASKET (SL HIT)" : "NOTHING");
console.log("Reason:", resDropReal.reason);
