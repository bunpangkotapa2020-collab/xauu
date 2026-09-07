const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Remove the old definition from line 538 to 568 approx
// The simplest is to replace the whole block with nothing.
const blockToRemove = `var old_eaState = {
  h4Bias: 'NEUTRAL',
  m15Setup: 'WAITING', // WAITING, READY_FOR_M1, CONSUMED
  liquiditySweep: false,
  cisd: false,
  breaker: false,
  idm: false,
  m1Ob: false,
  setupSide: 'NONE', // BUY, SELL
  lastUpdate: 0,
  tickCount: 0,
  prices: [] as number[],
  highs: [] as number[],
  lows: [] as number[]
};

function old_resetEASetup_v1(reason: string) {
  console.log(\`[NEW EA] RESET SETUP - REASON = \${reason}\`);
  eaState.m15Setup = 'WAITING';
  eaState.liquiditySweep = false;
  eaState.cisd = false;
  eaState.breaker = false;
  eaState.idm = false;
  eaState.m1Ob = false;
  eaState.setupSide = 'NONE';
  botState.signals = { gold: 'WAIT' };
  botState.signalDetails = undefined;
}`;

code = code.replace(blockToRemove, '');

// 2. Rename old_eaState to eaState everywhere
code = code.replace(/old_eaState/g, 'eaState');
// 3. Rename old_resetEASetup to resetEASetup everywhere
code = code.replace(/old_resetEASetup/g, 'resetEASetup');

fs.writeFileSync('server.ts', code);
