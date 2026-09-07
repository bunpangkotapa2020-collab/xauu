const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

if (!code.includes('stopLossDistance: number;')) {
    code = code.replace(/lotSize: number;/, 'lotSize: number;\n    stopLossDistance: number;\n    takeProfitDistance: number;');
}

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
