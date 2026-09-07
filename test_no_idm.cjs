const fs = require('fs');
let code = fs.readFileSync('paper_forward_test.cjs', 'utf8');
code = code.replace(
"if (m15DataRes.pdArray && m15DataRes.liquiditySweep && m15DataRes.cisd && m15DataRes.breaker && m15DataRes.idm) {",
"if (m15DataRes.pdArray && m15DataRes.liquiditySweep && m15DataRes.cisd && m15DataRes.breaker) {"
);
fs.writeFileSync('paper_forward_test.cjs', code);
