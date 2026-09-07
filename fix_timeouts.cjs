const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/AbortSignal\.timeout\(6000\)/g, "AbortSignal.timeout(10000)");
content = content.replace(/AbortSignal\.timeout\(8000\)/g, "AbortSignal.timeout(10000)");

fs.writeFileSync('server.ts', content);
