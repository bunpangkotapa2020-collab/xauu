const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "const startTime = getCambodiaMidnightISO();",
    "const startTime = botState.currentTradingDate || getCambodiaMidnightISO();"
);

fs.writeFileSync('server.ts', code);
