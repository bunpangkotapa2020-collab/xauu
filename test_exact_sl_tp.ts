import { DaRaOrderExecution } from './src/engines/dara_m1/DaRaOrderExecution';

const exec = new DaRaOrderExecution({} as any);

const settings = {
  lotSize: 0.1,
  slDistance: 10,
  tpDistance: 20
} as any;

const setupBuy: any = {
  direction: 'BUY',
  executionDirection: 'BUY',
  virtualSLPrice: 4330,
  virtualTPPrice: 4360
};

// Test BUY
const currentAsk = 4340.5; // Slightly off virtual to see what happens
const currentBid = 4340.5;

console.log("=== BUY ENTRY ===");
exec.executeOrder(setupBuy, 'XAUUSD', currentAsk, currentBid, settings, 0, true)
  .then(res => console.log(setupBuy.sharedSL, setupBuy.sharedTP));

const setupSell: any = {
  direction: 'SELL',
  executionDirection: 'SELL',
  virtualSLPrice: 4350,
  virtualTPPrice: 4320
};

console.log("\n=== SELL ENTRY ===");
exec.executeOrder(setupSell, 'XAUUSD', currentAsk, currentBid, settings, 0, true)
  .then(res => console.log(setupSell.sharedSL, setupSell.sharedTP));
