function checkSellSetup() {
  const lockedEntry = 95;
  const userSl = 2.0;
  const userTp = 5.0;
  return {
    direction: 'SELL',
    lockedEntryPrice: lockedEntry,
    virtualSLPrice: Number((lockedEntry + userSl).toFixed(3)),
    virtualTPPrice: Number((lockedEntry - userTp).toFixed(3)),
    userSlDistance: userSl,
    userTpDistance: userTp
  };
}

const sellSetup = checkSellSetup();
if (sellSetup) {
  (sellSetup as any).executionDirection = 'BUY';
  sellSetup.virtualSLPrice = Number((sellSetup.lockedEntryPrice - sellSetup.userSlDistance).toFixed(3));
  sellSetup.virtualTPPrice = Number((sellSetup.lockedEntryPrice + sellSetup.userTpDistance).toFixed(3));
}

console.log("=== Original Signal: SELL ===");
console.log("Execution Direction:", (sellSetup as any).executionDirection);
console.log("Locked Entry Price:", sellSetup.lockedEntryPrice);
console.log("Virtual SL Price (BUY Logic):", sellSetup.virtualSLPrice);
console.log("Virtual TP Price (BUY Logic):", sellSetup.virtualTPPrice);
