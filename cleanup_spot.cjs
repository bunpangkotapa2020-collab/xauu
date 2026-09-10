const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ =================================\n\/\/ 100% REAL LIVE SPOT GOLD FEED \(INSTITUTIONAL PHYSICAL GOLD PRICE - NO MOCK \/ NO FAKE\)\n\/\/ =================================\nlet lastRealSpotFetchTime = 0;\nlet cachedRealSpot: \{ bid: number, ask: number, spreadPoints: number, time: number \} \| null = null;/;
code = code.replace(regex, '');

fs.writeFileSync('server.ts', code);
console.log("Cleaned up variables");
