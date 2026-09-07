const fs = require('fs');
let code = fs.readFileSync('paper_forward_test.cjs', 'utf8');
code = code.replace("if (eaState.h4Bias === 'NEUTRAL') {", "if (eaState.h4Bias === 'NEUTRAL') { stats.noTrade++;");
code = code.replace("console.log(stats);", "console.log(stats); console.log('Total checks:', m1Data.length - startIndex);");
fs.writeFileSync('paper_forward_test.cjs', code);
