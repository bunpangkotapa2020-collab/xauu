const fs = require('fs');
const file = 'src/engines/dara_m1/DaRaM1Strategy.ts';
let code = fs.readFileSync(file, 'utf8');

// BUY SETUP PATCH
code = code.replace(
/let sweepIdx = -1;\s*for \(let i = swLow\.index \+ 1; i < candles\.length; i\+\) \{/,
`let sweepIdx = -1;
      // Strictly limit Sweep to happen soon after Swing Low
      for (let i = swLow.index + 1; i <= Math.min(swLow.index + 3, candles.length - 1); i++) {`
);

code = code.replace(
/let displacementFound = false;\s*let displacementIdx = -1;\s*for \(let i = sweepIdx; i < candles\.length; i\+\) \{/,
`let displacementFound = false;
      let displacementIdx = -1;
      // ពិនិត្យ Displacement ភ្លាមៗ (Same candle or next max 2 candles)
      const maxDispIdx = Math.min(sweepIdx + 2, candles.length - 1);
      for (let i = sweepIdx; i <= maxDispIdx; i++) {`
);

code = code.replace(
/let mssConfirmed = false;\s*let mssCandle: DaRaCandle \| null = null;\s*for \(let i = displacementIdx; i < candles\.length; i\+\) \{/,
`let mssConfirmed = false;
      let mssCandle: DaRaCandle | null = null;
      // ពិនិត្យ MSS នៅ Closed M1 Candle បន្ទាប់ភ្លាមៗ (Same or next max 2 candles)
      const maxMssIdx = Math.min(displacementIdx + 2, candles.length - 1);
      for (let i = displacementIdx; i <= maxMssIdx; i++) {`
);

// SELL SETUP PATCH
code = code.replace(
/let sweepIdx = -1;\s*for \(let i = swHigh\.index \+ 1; i < candles\.length; i\+\) \{/,
`let sweepIdx = -1;
      // Strictly limit Sweep to happen soon after Swing High
      for (let i = swHigh.index + 1; i <= Math.min(swHigh.index + 3, candles.length - 1); i++) {`
);

code = code.replace(
/let displacementFound = false;\s*let displacementIdx = -1;\s*for \(let i = sweepIdx; i < candles\.length; i\+\) \{/,
`let displacementFound = false;
      let displacementIdx = -1;
      // ពិនិត្យ Displacement ភ្លាមៗ
      const maxDispIdx = Math.min(sweepIdx + 2, candles.length - 1);
      for (let i = sweepIdx; i <= maxDispIdx; i++) {`
);

code = code.replace(
/let mssConfirmed = false;\s*let mssCandle: DaRaCandle \| null = null;\s*for \(let i = displacementIdx; i < candles\.length; i\+\) \{/,
`let mssConfirmed = false;
      let mssCandle: DaRaCandle | null = null;
      // ពិនិត្យ MSS នៅ Closed M1 Candle បន្ទាប់ភ្លាមៗ
      const maxMssIdx = Math.min(displacementIdx + 2, candles.length - 1);
      for (let i = displacementIdx; i <= maxMssIdx; i++) {`
);

fs.writeFileSync(file, code);
console.log('Strategy patched.');
