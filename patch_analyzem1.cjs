const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "const m1Res = analyzeM1(m1Candles, eaState.setupSide);",
  "const m1Res = analyzeM1(m1Candles, eaState.setupSide as 'BUY' | 'SELL');"
);
fs.writeFileSync('server.ts', code);
