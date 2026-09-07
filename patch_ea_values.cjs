const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

code = code.replace(/sl = entry - 10\.000;/, 'sl = entry - this.config.stopLossDistance;');
code = code.replace(/tp = entry \+ 10\.000;/, 'tp = entry + this.config.takeProfitDistance;');
code = code.replace(/sl = entry \+ 10\.000;/, 'sl = entry + this.config.stopLossDistance;');
code = code.replace(/tp = entry - 10\.000;/, 'tp = entry - this.config.takeProfitDistance;');

// Also replace hardcoded lot sizes in executeBuy/executeSell
// There are multiple 0.02 hardcoded lots
code = code.replace(/executeBuy\(this\.config\.symbol, 0\.02,/g, 'executeBuy(this.config.symbol, this.config.lotSize,');
code = code.replace(/executeSell\(this\.config\.symbol, 0\.02,/g, 'executeSell(this.config.symbol, this.config.lotSize,');

// Replace lot: 0.02 in the onExecutionSuccess block
code = code.replace(/lot: 0\.02,/g, 'lot: this.config.lotSize,');
code = code.replace(/Lot: 0\.02/g, 'Lot: ${this.config.lotSize}');

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
