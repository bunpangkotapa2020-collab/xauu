const fs = require('fs');
let code = fs.readFileSync('src/components/LiveIctEaMonitor.tsx', 'utf8');

// The file has a tab for 'm1', we should just let it be empty or remove it.
code = code.replace(/<button[^>]*>M1 /g, '<button className="hidden">M1 ');
code = code.replace(/\{selectedTab === 'm1' && \(/g, '{false && (');

fs.writeFileSync('src/components/LiveIctEaMonitor.tsx', code);
console.log("Patched monitor");
