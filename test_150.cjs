const fs = require('fs');
let code = fs.readFileSync('paper_forward_test.cjs', 'utf8');
code = code.replace("Math.max(0, m15Index-100)", "Math.max(0, m15Index-150)");
fs.writeFileSync('paper_forward_test.cjs', code);
