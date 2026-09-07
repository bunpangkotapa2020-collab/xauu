const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/ictEaEngine\.log/g, 'console.log');

fs.writeFileSync('server.ts', code);
