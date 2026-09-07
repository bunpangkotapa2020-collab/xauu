const fs = require('fs');
let code = fs.readFileSync('paper_forward_test.cjs', 'utf8');

// Replace getSwings with n=1 for IDM
code = code.replace(
"const recentLowsAfterSweep = lows.filter(s => s.index > sweepCandleIdx);",
"const recentLowsAfterSweep = getSwings(candles, 1).filter(s => s.type==='LOW' && s.index > sweepCandleIdx);"
);
code = code.replace(
"const recentHighsAfterSweep = highs.filter(s => s.index > sweepCandleIdx);",
"const recentHighsAfterSweep = getSwings(candles, 1).filter(s => s.type==='HIGH' && s.index > sweepCandleIdx);"
);

// We need to print stats.
fs.writeFileSync('paper_forward_test.cjs', code);
