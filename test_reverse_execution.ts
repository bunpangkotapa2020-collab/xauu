import { DaRaM1Strategy } from './src/engines/dara_m1/DaRaM1Strategy';
import { DaRaCandle } from './src/engines/dara_m1/types';

const strategy = new DaRaM1Strategy();
const candles: DaRaCandle[] = [];
const now = Date.now();
let price = 100.0;

// Generate 50 candles for finding swings
for (let i = 0; i < 50; i++) {
  candles.push({
    time: now - (50 - i) * 60000,
    open: price,
    high: price + 1,
    low: price - 1,
    close: price,
    volume: 100
  });
}

// Manually craft a BUY setup scenario
// Swing Low at index 40
candles[40].low = 95;
candles[40].close = 96;

// Sweep Candle at index 42
candles[42].low = 94; // sweeps 95
candles[42].close = 96; // closes above

// Swing High to break at index 45
candles[45].high = 105;

// Displacement / MSS at index 48
candles[48].close = 106; // breaks above 105
candles[48].open = 98; // Impulsive green body

const setup = strategy.scanForSetup(candles, {
  enabled: true,
  lotSize: 0.1,
  slDistance: 2.0,
  tpDistance: 5.0,
  maxOpenTrades: 5,
  liveTradingEnabled: false
}, 0.01);

console.log("=== ORIGINAL SIGNAL EXPECTED = BUY ===");
console.log("Signal Direction:", setup?.direction);
console.log("Execution Direction:", setup?.executionDirection);
console.log("Locked Entry Price:", setup?.lockedEntryPrice); // Should be 105
console.log("Virtual SL Price (SELL Logic):", setup?.virtualSLPrice); // Should be 107
console.log("Virtual TP Price (SELL Logic):", setup?.virtualTPPrice); // Should be 100
