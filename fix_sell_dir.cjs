const fs = require('fs');

let ea = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');
const lines = ea.split('\n');

let inSell = false;
for (let i=0; i<lines.length; i++) {
    if (lines[i].includes(`EXECUTE: SELL`)) {
        inSell = true;
    }
    if (inSell && lines[i].includes(`direction: 'BUY',`)) {
        lines[i] = lines[i].replace(`'BUY'`, `'SELL'`);
        break;
    }
}
fs.writeFileSync('src/MASTER_ICT_EA.ts', lines.join('\n'));
console.log("FIXED SELL DIRECTION");
