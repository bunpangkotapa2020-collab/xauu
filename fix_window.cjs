const fs = require('fs');
let code = fs.readFileSync('paper_forward_test.cjs', 'utf8');
code = code.replace("const recentM15 = m15Data.slice(Math.max(0, m15Index-40), m15Index+1);", "const recentM15 = m15Data.slice(Math.max(0, m15Index-100), m15Index+1);");
code = code.replace("if (!candles || candles.length < 20) return", "if (!candles || candles.length < 20) return"); // no change
fs.writeFileSync('paper_forward_test.cjs', code);
