const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldLog = "console.error('Market Status Check Error:', err);";
const newLog = `if (err.name === 'TimeoutError') {
            console.warn('Market Status Check Error: Timeout (10s)');
        } else {
            console.error('Market Status Check Error:', err);
        }`;

content = content.replace(oldLog, newLog);
fs.writeFileSync('server.ts', content);
