const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('LIVE_TRADING_ENABLED = '));
console.log(lines.slice(Math.max(0, start - 20), start + 20).join('\n'));
