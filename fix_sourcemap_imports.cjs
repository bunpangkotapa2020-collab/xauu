const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importRegex = /(?:import\s+.*?from\s+['"].*?['"];?)+/g;
const imports = [];
let match;
while ((match = importRegex.exec(code)) !== null) {
  imports.push(match[0]);
}

code = code.replace(importRegex, '');
code = imports.join('\n') + '\n\n' + code;

fs.writeFileSync('server.ts', code);
