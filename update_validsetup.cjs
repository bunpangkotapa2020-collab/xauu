const fs = require('fs');
let content = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');
content = content.replace(
  /rr: Number\(rrEst\.toFixed\(2\)\),\n            setupId: setupId\n        \};/g,
  "rr: Number(rrEst.toFixed(2)),\n            setupId: setupId,\n            stage: 'WAITING',\n            executionState: undefined,\n            obHigh: obData.obHigh,\n            obLow: obData.obLow\n        };");
fs.writeFileSync('src/MASTER_ICT_EA.ts', content);
