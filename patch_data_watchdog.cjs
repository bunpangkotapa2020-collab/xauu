const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /if \(goldData \|\| btcData\) \{[\s\S]*?botState\.lastPriceUpdate = new Date\(\)\.toLocaleTimeString\('km-KH'[\s\S]*?\}/;

const replacement = `if (goldData || btcData) {
                botState.lastPriceUpdate = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                botState.lastTickTime = Date.now();
                botState.marketDataStatus = '🟢 LIVE';
            }`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log('patched data watchdog logic');
} else {
    console.log('regex not matched for watchdog in server.ts');
}
