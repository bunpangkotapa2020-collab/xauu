const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/executeAIAnalysis\(\)\.then\(\(\) => \{\s*botState\.startConfirmedTime = new Date\(\)\.toISOString\(\);\s*\}\)\.catch\(console\.error\);/m, 'botState.startConfirmedTime = new Date().toISOString();');

fs.writeFileSync('server.ts', code);
