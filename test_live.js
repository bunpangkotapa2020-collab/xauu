const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf-8');
if (!code.includes('trailingDistance')) process.exit(2);
