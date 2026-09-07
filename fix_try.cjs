const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /marketDataStatus = '🟢 LIVE';\n            \}\n            \}/g,
    "marketDataStatus = '🟢 LIVE';\n            }"
);

fs.writeFileSync('server.ts', code);
