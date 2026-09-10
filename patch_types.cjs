const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(
  /entryDistance\?\: number;/g,
  `entryDistance?: number;
    trailingDistance?: number;`
);
fs.writeFileSync('server.ts', code);
console.log('Patched types in server.ts');
