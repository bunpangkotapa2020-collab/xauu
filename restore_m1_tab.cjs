const fs = require('fs');
let code = fs.readFileSync('src/components/LiveIctEaMonitor.tsx', 'utf8');

const target = `              { id: 'm15', label: 'កម្រិត M15' },
              { id: 'system', label: 'ប្រព័ន្ធ (System)' },`;

const replacement = `              { id: 'm15', label: 'កម្រិត M15' },
              { id: 'm1', label: 'កម្រិត M1' },
              { id: 'system', label: 'ប្រព័ន្ធ (System)' },`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/LiveIctEaMonitor.tsx', code);
    console.log("Restored M1 tab.");
} else {
    console.log("Target not found.");
}
