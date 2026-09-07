const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf-8');

// Bullish replace
code = code.replace(
    "            s.actualEntryPrice = data.ask;\n            s.lockedSlTarget = s.lockedSlTarget || (s.obLow - 0.5);\n            s.lockedTpTarget = s.lockedTpTarget || Math.max(...(data.m1Candles||[]).slice(-20).map(c=>c.high));",
    `            s.actualEntryPrice = data.ask;
            let rawSlTarget = s.lockedSlTarget || (s.obLow - 0.5);
            let rawTpTarget = s.lockedTpTarget || Math.max(...(data.m1Candles||[]).slice(-20).map(c=>c.high));
            
            // --- MINIMUM DISTANCE PROTECTION ---
            const minSlDist = 2.0;
            if ((s.actualEntryPrice - rawSlTarget) < minSlDist) {
                rawSlTarget = s.actualEntryPrice - minSlDist;
            }
            s.lockedSlTarget = rawSlTarget;
            s.lockedTpTarget = rawTpTarget;`
);

// Bearish replace
code = code.replace(
    "            s.actualEntryPrice = data.bid;\n            s.lockedSlTarget = s.lockedSlTarget || (s.obHigh + 0.5);\n            s.lockedTpTarget = s.lockedTpTarget || Math.min(...(data.m1Candles||[]).slice(-20).map(c=>c.low));",
    `            s.actualEntryPrice = data.bid;
            let rawSlTarget = s.lockedSlTarget || (s.obHigh + 0.5);
            let rawTpTarget = s.lockedTpTarget || Math.min(...(data.m1Candles||[]).slice(-20).map(c=>c.low));
            
            // --- MINIMUM DISTANCE PROTECTION ---
            const minSlDist = 2.0;
            if ((rawSlTarget - s.actualEntryPrice) < minSlDist) {
                rawSlTarget = s.actualEntryPrice + minSlDist;
            }
            s.lockedSlTarget = rawSlTarget;
            s.lockedTpTarget = rawTpTarget;`
);

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
console.log('Patched');
