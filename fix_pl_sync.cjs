const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldLog = "console.error('[ICT EA] P/L Sync Error:', error);";
const newLog = `if (error.name === 'TimeoutError') {
            console.warn('[ICT EA] P/L Sync Error: Timeout (10s)');
        } else {
            console.error('[ICT EA] P/L Sync Error:', error);
        }`;

content = content.replace(/AbortSignal\.timeout\(5000\)/g, "AbortSignal.timeout(10000)");
content = content.replace(oldLog, newLog);
fs.writeFileSync('server.ts', content);
