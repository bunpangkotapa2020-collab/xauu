import { DaRaOrderExecution } from './src/engines/dara_m1/DaRaOrderExecution';

const exec = new DaRaOrderExecution({} as any);

const settings = {
  lotSize: 0.1,
  slDistance: 5,
  tpDistance: 30
} as any;

const setupBuyToSell: any = {
  direction: 'BUY',
  executionDirection: 'SELL',
  virtualSLPrice: 4345, // unused now
  virtualTPPrice: 4310
};

const currentAsk = 4340; 
const currentBid = 4340;

console.log("=== ORIGINAL BUY -> EXECUTE SELL ===");
exec.executeOrder(setupBuyToSell, 'XAUUSD', currentAsk, currentBid, settings, 0, true)
  .then(res => {
     console.log("Calculated SL (Expected 4345):", setupBuyToSell.sharedSL);
     console.log("Calculated TP (Expected 4310):", setupBuyToSell.sharedTP);
  });

const setupSellToBuy: any = {
  direction: 'SELL',
  executionDirection: 'BUY',
  virtualSLPrice: 4335,
  virtualTPPrice: 4370
};

console.log("\n=== ORIGINAL SELL -> EXECUTE BUY ===");
exec.executeOrder(setupSellToBuy, 'XAUUSD', currentAsk, currentBid, settings, 0, true)
  .then(res => {
     console.log("Calculated SL (Expected 4335):", setupSellToBuy.sharedSL);
     console.log("Calculated TP (Expected 4370):", setupSellToBuy.sharedTP);
  });
