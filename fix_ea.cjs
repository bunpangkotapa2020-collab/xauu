const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf-8');

// Bullish replace
code = code.replace(
    /let rawSlTarget = s\.lockedSlTarget \|\| \(s\.obLow - 0\.5\);\s+let rawTpTarget = s\.lockedTpTarget \|\| Math\.max\(\.\.\.\(data\.m1Candles\|\|\[\]\)\.slice\(-20\)\.map\(c=>c\.high\)\);\s+\/\/ --- MINIMUM DISTANCE PROTECTION ---\s+const minSlDist = 2\.0;\s+if \(\(s\.actualEntryPrice - rawSlTarget\) < minSlDist\) {\s+rawSlTarget = s\.actualEntryPrice - minSlDist;\s+}\s+s\.lockedSlTarget = rawSlTarget;\s+s\.lockedTpTarget = rawTpTarget;/g,
    `let rawSlTarget = s.lockedSlTarget || (s.obLow - 0.5);
            let rawTpTarget = s.lockedTpTarget || Math.max(...(data.m1Candles||[]).slice(-20).map(c=>c.high));
            
            // --- MINIMUM DISTANCE PROTECTION ---
            const minSlDist = 10.0;
            if ((s.actualEntryPrice - rawSlTarget) < minSlDist) {
                rawSlTarget = s.actualEntryPrice - minSlDist;
            }
            s.lockedSlTarget = rawSlTarget;
            s.lockedTpTarget = rawTpTarget;`
);

// Bearish replace
code = code.replace(
    /let rawSlTarget = s\.lockedSlTarget \|\| \(s\.obHigh \+ 0\.5\);\s+let rawTpTarget = s\.lockedTpTarget \|\| Math\.min\(\.\.\.\(data\.m1Candles\|\|\[\]\)\.slice\(-20\)\.map\(c=>c\.low\)\);\s+\/\/ --- MINIMUM DISTANCE PROTECTION ---\s+const minSlDist = 2\.0;\s+if \(\(rawSlTarget - s\.actualEntryPrice\) < minSlDist\) {\s+rawSlTarget = s\.actualEntryPrice \+ minSlDist;\s+}\s+s\.lockedSlTarget = rawSlTarget;\s+s\.lockedTpTarget = rawTpTarget;/g,
    `let rawSlTarget = s.lockedSlTarget || (s.obHigh + 0.5);
            let rawTpTarget = s.lockedTpTarget || Math.min(...(data.m1Candles||[]).slice(-20).map(c=>c.low));
            
            // --- MINIMUM DISTANCE PROTECTION ---
            const minSlDist = 10.0;
            if ((rawSlTarget - s.actualEntryPrice) < minSlDist) {
                rawSlTarget = s.actualEntryPrice + minSlDist;
            }
            s.lockedSlTarget = rawSlTarget;
            s.lockedTpTarget = rawTpTarget;`
);

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
console.log('Fixed EA');
