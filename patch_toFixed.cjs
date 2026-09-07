const fs = require('fs');
let code = fs.readFileSync('src/components/DaRaSetupView.tsx', 'utf8');

code = code.replace(/setup\.lockedEntryPrice\.toFixed/g, 'setup?.lockedEntryPrice?.toFixed');
code = code.replace(/setup\.direction/g, 'setup?.direction');
code = code.replace(/setup\.mssLevel\.toFixed/g, 'setup?.mssLevel?.toFixed');
code = code.replace(/setup\.sweepLevel\.toFixed/g, 'setup?.sweepLevel?.toFixed');
code = code.replace(/activeTrade\.entryPrice\?\.toFixed/g, 'activeTrade?.entryPrice?.toFixed');

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log('Patched toFixed errors');
