const fs = require('fs');
const file = 'src/engines/dara_m1/DaRaOrderExecution.ts';
let code = fs.readFileSync(file, 'utf8');

// Change function signature
code = code.replace(/positionIndex: number = 1/g, 'levelIndex: number');

// Hard limit check
code = code.replace(/\/\/ 0\. Hard Limit: 1 Confirmed Signal = 2 Positions MAX\n    if \\(positionIndex > 2\\) \\{\n      return \\{ success: false, error: \`Strict Rule Violation: 1 Confirmed Signal = 2 Positions MAX \\(Position #\\$\\{positionIndex\\} is strictly FORBIDDEN\\)\` \\};\n    \\}/,
`// 0. Hard Limit: 1 Confirmed Signal = 5 Positions MAX
    const positionNumber = levelIndex + 1;
    if (positionNumber > 5) {
      return { success: false, error: \`Strict Rule Violation: 1 Confirmed Signal = 5 Positions MAX (Position #\${positionNumber} is strictly FORBIDDEN)\` };
    }`);

// Change execKey from positionIndex to positionNumber
code = code.replace(/const execKey = `\$\{setup\.id\}_P\$\{positionIndex\}`;/g, 'const execKey = `${setup.id}_P${positionNumber}`;');
code = code.replace(/Position #\$\{positionIndex\}/g, 'Position #${positionNumber}');

// Change SL / TP Logic
const oldSLLogic = `// 4. Calculate SL and TP based strictly on Market Entry Price
    let sl: number;
    let tp: number;
    let openPrice: number;

    if (setup.direction === 'BUY') {
      openPrice = currentAsk;
      sl = Number((openPrice - slPriceDistance).toFixed(3));
      tp = Number((openPrice + tpPriceDistance).toFixed(3));
    } else {
      openPrice = currentBid;
      sl = Number((openPrice + slPriceDistance).toFixed(3));
      tp = Number((openPrice - tpPriceDistance).toFixed(3));
    }`;

const newSLLogic = `// 4. Calculate SL and TP based strictly on original Locked Entry Price
    let sl: number;
    let tp: number;
    let openPrice: number = setup.direction === 'BUY' ? currentAsk : currentBid;

    if (setup.sharedSL !== undefined && setup.sharedTP !== undefined) {
      sl = setup.sharedSL;
      tp = setup.sharedTP;
    } else {
      sl = setup.virtualSLPrice;
      tp = setup.virtualTPPrice;
      setup.sharedSL = sl;
      setup.sharedTP = tp;
    }`;

code = code.replace(oldSLLogic, newSLLogic);

fs.writeFileSync(file, code);
