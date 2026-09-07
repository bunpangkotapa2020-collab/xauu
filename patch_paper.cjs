const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace("paperMode: true, // STRICTLY SAFE ANALYSIS MODE", "paperMode: false, // ENABLED LIVE REAL TRADING");
fs.writeFileSync('server.ts', code);
