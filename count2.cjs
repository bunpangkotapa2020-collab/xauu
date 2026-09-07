const fs = require('fs');
const code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const lines = code.split('\n');
let depth = 0;
let started = false;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('private validateRetracement')) {
        depth = 1; 
        started = true;
    }
    const open = (line.match(/\{/g) || []).length;
    const close = (line.match(/\}/g) || []).length;
    depth += open;
    depth -= close;
    
    if (started) {
        console.log(`L${i+1} D${depth}: ${line.trim()}`);
        if (depth === 1) {
            break;
        }
    }
}
