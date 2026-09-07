const fs = require('fs');
const file = 'src/MASTER_ICT_EA.ts';
let code = fs.readFileSync(file, 'utf8');

// Update analyzeSequence call to detectDynamicOrderBlock
code = code.replace(
    'const obData = this.detectDynamicOrderBlock(data.m1Candles, bias);',
    'const obData = this.detectDynamicOrderBlock(data.m1Candles, bias, data.symbol || this.config.symbol);'
);

// Update detectDynamicOrderBlock signature
code = code.replace(
    'private detectDynamicOrderBlock(m1: Candle[], bias: SetupBias) {',
    'private detectDynamicOrderBlock(m1: Candle[], bias: SetupBias, symbol: string) {'
);

// Add the executedSetupIds check inside the loop
const targetLoop = `        for (let i = startIndex; i < N - 2; i++) {
            const obCandle = m1[i];`;
const replacementLoop = `        for (let i = startIndex; i < N - 2; i++) {
            const obCandle = m1[i];
            
            // SKIP OBs that have already been executed, invalidated, or cancelled
            const potentialSetupId = \`\${symbol}-\${bias}-M15Sweep-M1OB-\${obCandle.time}\`;
            if (this.state.executedSetupIds.has(potentialSetupId)) {
                continue;
            }`;

if (code.includes(targetLoop)) {
    code = code.replace(targetLoop, replacementLoop);
    fs.writeFileSync(file, code);
    console.log('Patched detectDynamicOrderBlock successfully');
} else {
    console.log('Target loop not found');
}
