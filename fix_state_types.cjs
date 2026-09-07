const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /lastPriceUpdate\?: string;/;
const replacement = "lastPriceUpdate?: string;\n  lastTickTime?: number;\n  marketDataStatus?: string;\n  activeGoldSymbol?: string;";

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log('Fixed BotServerState in server.ts');
}

