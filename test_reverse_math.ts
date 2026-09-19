import { DaRaM1Strategy } from './src/engines/dara_m1/DaRaM1Strategy';

// We bypass the scanning and just call a mock function that simulates what the strategy does
function checkBuySetup() {
  const lockedEntry = 105;
  const userSl = 2.0;
  const userTp = 5.0;
  return {
    direction: 'BUY',
    lockedEntryPrice: lockedEntry,
    virtualSLPrice: Number((lockedEntry - userSl).toFixed(3)),
    virtualTPPrice: Number((lockedEntry + userTp).toFixed(3)),
    userSlDistance: userSl,
    userTpDistance: userTp
  };
}

const buySetup = checkBuySetup();
if (buySetup) {
  (buySetup as any).executionDirection = 'SELL';
  buySetup.virtualSLPrice = Number((buySetup.lockedEntryPrice + buySetup.userSlDistance).toFixed(3));
  buySetup.virtualTPPrice = Number((buySetup.lockedEntryPrice - buySetup.userTpDistance).toFixed(3));
}

console.log("=== Original Signal: BUY ===");
console.log("Execution Direction:", (buySetup as any).executionDirection);
console.log("Locked Entry Price:", buySetup.lockedEntryPrice);
console.log("Virtual SL Price (SELL Logic):", buySetup.virtualSLPrice);
console.log("Virtual TP Price (SELL Logic):", buySetup.virtualTPPrice);
