const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(/>EXECUTING\.\.\.</g, ">🟡 EXECUTING...<");
code = code.replace(/>SUCCESS</g, ">🟢 SUCCESS<");
code = code.replace(/>FAILED</g, ">🔴 FAILED<");

fs.writeFileSync('src/components/MainDashboard.tsx', code);
