const fs = require('fs');
let code = fs.readFileSync('src/components/LiveIctEaMonitor.tsx', 'utf8');

const startIndex = code.indexOf('{/* 5. SYSTEM HEALTH MATRIX */}');
const nextSection = code.indexOf('{/* 6. LIVE ANALYSIS LOGS CONSOLE');

if (startIndex !== -1 && nextSection !== -1) {
    const chunkToRemove = code.substring(startIndex, nextSection);
    code = code.replace(chunkToRemove, '');
    fs.writeFileSync('src/components/LiveIctEaMonitor.tsx', code);
    console.log("Deleted SYSTEM HEALTH MATRIX.");
} else {
    console.log("Could not find bounds.");
}
