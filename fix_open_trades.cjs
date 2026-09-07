const fs = require('fs');
let code = fs.readFileSync('src/engines/dara_m1/DaRaM1Engine.ts', 'utf8');

// Line 281-282
code = code.replace(
    'const activePosCount = (this.stateMachine.getActivePosition() ? 1 : 0) + (this.additionalPosition ? 1 : 0);\n            const safety = this.evaluateSafety(feed.spreadPoints, activePosCount);',
    'const safety = this.evaluateSafety(feed.spreadPoints, feed.openTradesCount);'
);

// Line 318-320
code = code.replace(
    'const activePosCount = (this.stateMachine.getActivePosition() ? 1 : 0) + (this.additionalPosition ? 1 : 0);\n      const openTradesCount = activePosCount;\n      const initialSafety = this.evaluateSafety(feed.spreadPoints, openTradesCount);',
    'const initialSafety = this.evaluateSafety(feed.spreadPoints, feed.openTradesCount);'
);

// Line 336
code = code.replace(
    'const preExecSafety = this.evaluateSafety(feed.spreadPoints, openTradesCount);',
    'const preExecSafety = this.evaluateSafety(feed.spreadPoints, feed.openTradesCount);'
);

// Line 394
code = code.replace(
    'const safety = this.evaluateSafety(feed.spreadPoints, 0);',
    'const safety = this.evaluateSafety(feed.spreadPoints, feed.openTradesCount);'
);

fs.writeFileSync('src/engines/dara_m1/DaRaM1Engine.ts', code);
