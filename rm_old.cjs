const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const funcsToRemove = ['analyzeM15', 'analyzeM1', 'getSwings'];

for (const func of funcsToRemove) {
    const regex = new RegExp(`function ${func}\\([\\s\\S]*?\\n\\}\\n`, 'g');
    code = code.replace(regex, '');
}

fs.writeFileSync('server.ts', code);
