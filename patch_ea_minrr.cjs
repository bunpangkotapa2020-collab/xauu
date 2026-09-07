const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

code = code.replace(/if \(rrEst >= this\.config\.minRR\) \{/, 'if (true) {');
code = code.replace(/this\.addAnalysisLog\(\`Setup Confirmed Notification Blocked: RR \$\{rrEst\.toFixed\(2\)\} < \$\{this\.config\.minRR\}\`, 'warn'\);/, '');

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
