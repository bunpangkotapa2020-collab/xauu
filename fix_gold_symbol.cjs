const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /symbol: goldSymbol,/g;
code = code.replace(regex, "symbol: botState.activeGoldSymbol || (botState.account.accountType === 'cent' ? 'XAUUSDc' : 'XAUUSDm'),");

const saveRegex = /botState\.goldPrice = goldData\.quote\.bid;/g;
code = code.replace(saveRegex, "botState.goldPrice = goldData.quote.bid;\n                botState.activeGoldSymbol = goldData.symbol;");

fs.writeFileSync('server.ts', code);
console.log('Fixed goldSymbol for trade');
