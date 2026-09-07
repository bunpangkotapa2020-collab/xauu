const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("  lastSavedAt: new Date().toISOString(),\n};", "  lastSavedAt: new Date().toISOString(),\n  isInsideTradingHours: true,\n};");

fs.writeFileSync('server.ts', code);
console.log("Fixed botState object");
