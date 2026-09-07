const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// I want to delete `detectDynamicOrderBlock` entirely, which goes until `validateRetracement`.
let detStart = code.indexOf('    private detectDynamicOrderBlock');
let valStart = code.indexOf('    private validateRetracement');
let exeStart = code.indexOf('    private async executeTrade');

if (detStart !== -1 && exeStart !== -1) {
    // Delete from detectDynamicOrderBlock all the way to just before executeTrade.
    // This will remove detectDynamicOrderBlock AND validateRetracement.
    code = code.substring(0, detStart) + code.substring(exeStart);
    fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
    console.log("Deleted detectDynamicOrderBlock and validateRetracement.");
} else {
    console.log("Could not find blocks to delete.");
}

