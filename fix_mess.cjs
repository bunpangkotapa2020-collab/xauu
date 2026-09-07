const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/\}\);\);/g, '});');
code = code.replace(/\}\);\)\.catch/g, '}).catch');

fs.writeFileSync('server.ts', code);
