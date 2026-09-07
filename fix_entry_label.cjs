const fs = require('fs');
let code = fs.readFileSync('src/components/LiveIctEaMonitor.tsx', 'utf8');

const target = `<span className="text-[10px] text-slate-400 uppercase">តម្លៃចូល (EST. ENTRY)</span>`;
const rep = `<span className="text-[10px] text-slate-400 uppercase">តំបន់តម្លៃចូល (ENTRY ZONE)</span>`;
code = code.replace(target, rep);

fs.writeFileSync('src/components/LiveIctEaMonitor.tsx', code);
console.log("Updated ENTRY ZONE label.");
