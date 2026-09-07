const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// 1. Make config public
code = code.replace('private config: EAConfig;', 'public config: EAConfig;');

// 2. Setup ID error in ICT_MT5_Integration.ts
let integCode = fs.readFileSync('src/ICT_MT5_Integration.ts', 'utf8');
integCode = integCode.replace(
    /ticket: 'MOCK_' \+ Date.now\(\),/g,
    "ticket: 'MOCK_' + Date.now(),\n            setupId: 'MOCK_SETUP',"
);
fs.writeFileSync('src/ICT_MT5_Integration.ts', integCode);

// 3. Fix the "string" vs "number" argument
// Look for where Date.now() or similar is passed as string instead of number
// Actually let's just find "export interface ICTSetup" to see its fields
fs.writeFileSync('src/MASTER_ICT_EA.ts', code);

