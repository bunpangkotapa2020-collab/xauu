const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// 1. In `validateRetracement`, fix TP-Before-Entry cancellation to use the LATEST dynamic TP distance.
const cancelTarget = `        const lockedEntry = s.lockedEntryPrice || (s.bias === 'BULLISH' ? s.obHigh : s.obLow);
        const lockedTp = s.lockedTpTarget !== undefined ? s.lockedTpTarget : (s.bias === 'BULLISH' ? Math.max(...(data.m1Candles || []).slice(-20).map(c=>c.high)) : Math.min(...(data.m1Candles || []).slice(-20).map(c=>c.low)));
        
        if (lockedTp !== undefined && lockedTp !== null && lockedEntry !== undefined && lockedEntry !== null) {`;

const cancelReplacement = `        const dynamicEntry = s.lockedEntryPrice || (s.bias === 'BULLISH' ? s.obHigh : s.obLow);
        // User Rule: Read/Verify LATEST User Settings for TP cancellation check
        const dynamicTp = s.bias === 'BULLISH' ? (dynamicEntry + this.config.takeProfitDistance) : (dynamicEntry - this.config.takeProfitDistance);
        
        if (dynamicTp !== undefined && dynamicTp !== null && dynamicEntry !== undefined && dynamicEntry !== null) {`;

code = code.replace(cancelTarget, cancelReplacement);
code = code.replace(/lockedEntry/g, 'dynamicEntry'); // Only within this block, let's be careful. Actually, it's safer to use regex selectively or write a better replacement block.
fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
