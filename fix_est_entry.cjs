const fs = require('fs');
let content = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

content = content.replace(
  /const entryEst = bias === 'BULLISH' \? data\.ask : data\.bid;/,
  `const entryEst = bias === 'BULLISH' ? obData.obHigh : obData.obLow; // The ACTUAL target retracement price`
);

fs.writeFileSync('src/MASTER_ICT_EA.ts', content);
