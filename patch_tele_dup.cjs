const fs = require('fs');
let svr = fs.readFileSync('server.ts', 'utf8');

// Replace the sendTradeOpenAlert calls in executeBuy
svr = svr.replace(/sendTradeOpenAlert\(\{\s*type:\s*'BUY',[^}]+\}\)\.catch\(console\.error\);/g, 
                  "// sendTradeOpenAlert disabled per duplicate alert patch");

// Replace the sendTradeOpenAlert calls in executeSell
svr = svr.replace(/sendTradeOpenAlert\(\{\s*type:\s*'SELL',[^}]+\}\)\.catch\(console\.error\);/g, 
                  "// sendTradeOpenAlert disabled per duplicate alert patch");

fs.writeFileSync('server.ts', svr);
console.log("PATCHED TELEGRAM DUP ALERTS");
