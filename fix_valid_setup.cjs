const fs = require('fs');
let code = fs.readFileSync('src/components/LiveIctEaMonitor.tsx', 'utf8');

const target1 = `🟢 រកឃើញ SETUP ត្រឹមត្រូវ — ត្រៀមចូល TRADE ពេល RETRACEMENT (VALID SETUP FORMED)`;
const rep1 = `🟢 រកឃើញ SETUP ត្រឹមត្រូវ — ត្រៀមចូល TRADE (VALID SETUP FORMED)`;
code = code.replace(target1, rep1);

fs.writeFileSync('src/components/LiveIctEaMonitor.tsx', code);
console.log("Updated setup valid text.");
