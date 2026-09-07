const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const m15Start = code.indexOf('        let m15Swept = false;');
const m15End = code.indexOf('        // M15 Swept & CISD Confirmed');

console.log("Start:", m15Start, "End:", m15End);
