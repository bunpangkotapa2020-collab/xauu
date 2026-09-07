const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace('isAutoSaved?: boolean;', 'consecutiveLosses?: number;\n  cooldownUntil?: number | null;\n  isAutoSaved?: boolean;');

fs.writeFileSync('server.ts', code);
console.log("Fixed interface");
