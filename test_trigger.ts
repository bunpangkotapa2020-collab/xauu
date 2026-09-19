import { DaRaM1StateMachine } from './src/engines/dara_m1/DaRaM1StateMachine';

const sm = new DaRaM1StateMachine(null as any, null as any);

const settings = {
  entryDistance: 1.0
} as any;

console.log("=== TEST 1: Original BUY, Entry Distance = 1 ===");
const setup1 = {
  direction: 'BUY',
  executionDirection: 'SELL',
  lockedEntryPrice: 100
} as any;

(sm as any).currentState = 'SCANNING';
sm.onSetupDetected(setup1, settings);
console.log("Original: BUY -> Executing: SELL");
console.log("Master Entry:", 100);
console.log("Entry Trigger (L1):", setup1.entryLevels[0].targetPrice); // Expected 99

console.log("\n=== TEST 2: Original BUY, Entry Distance = 5 ===");
const setup2 = {
  direction: 'BUY',
  executionDirection: 'SELL',
  lockedEntryPrice: 100
} as any;
settings.entryDistance = 5.0;
(sm as any).currentState = 'SCANNING';
sm.onSetupDetected(setup2, settings);
console.log("Original: BUY -> Executing: SELL");
console.log("Master Entry:", 100);
console.log("Entry Trigger (L1):", setup2.entryLevels[0].targetPrice); // Expected 95

console.log("\n=== TEST 3: Original SELL, Entry Distance = 1 ===");
const setup3 = {
  direction: 'SELL',
  executionDirection: 'BUY',
  lockedEntryPrice: 100
} as any;
settings.entryDistance = 1.0;
(sm as any).currentState = 'SCANNING';
sm.onSetupDetected(setup3, settings);
console.log("Original: SELL -> Executing: BUY");
console.log("Master Entry:", 100);
console.log("Entry Trigger (L1):", setup3.entryLevels[0].targetPrice); // Expected 101

console.log("\n=== TEST 4: Original SELL, Entry Distance = 5 ===");
const setup4 = {
  direction: 'SELL',
  executionDirection: 'BUY',
  lockedEntryPrice: 100
} as any;
settings.entryDistance = 5.0;
(sm as any).currentState = 'SCANNING';
sm.onSetupDetected(setup4, settings);
console.log("Original: SELL -> Executing: BUY");
console.log("Master Entry:", 100);
console.log("Entry Trigger (L1):", setup4.entryLevels[0].targetPrice); // Expected 105
