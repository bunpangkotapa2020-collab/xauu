const fs = require('fs');
const code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const lines = code.split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('private validateRetracement')) {
        console.log('Start at line', i + 1);
        depth = 0;
    }
    const open = (line.match(/\{/g) || []).length;
    const close = (line.match(/\}/g) || []).length;
    depth += open;
    depth -= close;
    
    if (i >= 745 && i <= 995) {
        console.log(`L${i+1} D${depth}: ${line}`);
    }
}
