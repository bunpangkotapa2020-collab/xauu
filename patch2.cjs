const fs = require('fs');
const file = 'src/MASTER_ICT_EA.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix Invalidation blocks
const invalidationOld = "        if (s.bias === 'BULLISH' && data.bid < (s.obLow - 0.1)) {\n            this.log(`=== RETRACEMENT DIAGNOSTIC (BULLISH) ===`);";
const invalidationNew = "        const latestM1 = data.m1Candles && data.m1Candles.length > 0 ? data.m1Candles[data.m1Candles.length - 1] : null;\n        const spread = data.ask - data.bid;\n        const latestM1AskHigh = latestM1 ? latestM1.high + spread : data.ask;\n        \n        const isBullishInvalidated = s.bias === 'BULLISH' && (data.bid < (s.obLow - 0.1) || (latestM1 && latestM1.low < (s.obLow - 0.1)));\n        const isBearishInvalidated = s.bias === 'BEARISH' && (data.ask > (s.obHigh + 0.1) || (latestM1 && latestM1AskHigh > (s.obHigh + 0.1)));\n\n        if (isBullishInvalidated) {\n            this.log(`=== RETRACEMENT DIAGNOSTIC (BULLISH) ===`);";
code = code.replace(invalidationOld, invalidationNew);

const invalidationBearishOld = "        if (s.bias === 'BEARISH' && data.ask > (s.obHigh + 0.1)) {";
const invalidationBearishNew = "        if (isBearishInvalidated) {";
code = code.replace(invalidationBearishOld, invalidationBearishNew);

// 2. Fix Cancellation Engine lockedTp
const lockedTpOld = "const lockedTp = s.lockedTpTarget;\n        if (lockedTp !== undefined && lockedTp !== null && lockedEntry !== undefined && lockedEntry !== null) {";
const lockedTpNew = "const lockedTp = s.lockedTpTarget !== undefined ? s.lockedTpTarget : (s.bias === 'BULLISH' ? Math.max(...(data.m1Candles || []).slice(-20).map(c=>c.high)) : Math.min(...(data.m1Candles || []).slice(-20).map(c=>c.low)));\n        if (lockedTp !== undefined && lockedTp !== null && lockedEntry !== undefined && lockedEntry !== null) {";
code = code.replace(lockedTpOld, lockedTpNew);

// 3. Fix Cancellation Engine touch checks to include latestM1
const entryTouchedOld = "            if (s.bias === 'BULLISH') {\n                entryTouched = data.ask <= lockedEntry;\n                tpTouched = Math.max(data.bid, data.ask) >= lockedTp;\n            } else {\n                entryTouched = data.bid >= lockedEntry;\n                tpTouched = Math.min(data.bid, data.ask) <= lockedTp;\n            }";
const entryTouchedNew = "            if (s.bias === 'BULLISH') {\n                entryTouched = data.ask <= lockedEntry || (latestM1 && (latestM1.low + spread) <= lockedEntry) ? true : false;\n                tpTouched = Math.max(data.bid, data.ask) >= lockedTp || (latestM1 && latestM1.high >= lockedTp) ? true : false;\n            } else {\n                entryTouched = data.bid >= lockedEntry || (latestM1 && latestM1.high >= lockedEntry) ? true : false;\n                tpTouched = Math.min(data.bid, data.ask) <= lockedTp || (latestM1 && latestM1.low <= lockedTp) ? true : false;\n            }";
code = code.replace(entryTouchedOld, entryTouchedNew);

// 4. Fix Trigger Blocks
const triggerBullishOld = "        if (s.bias === 'BULLISH' && data.ask <= s.obHigh && data.ask >= s.obLow) {\n            const t0 = new Date().toISOString();";
const triggerBullishNew = "        let triggerBullish = s.bias === 'BULLISH' && data.ask <= s.obHigh && data.ask >= s.obLow;\n        if (s.bias === 'BULLISH' && !triggerBullish && latestM1 && (latestM1.low + spread) <= s.obHigh && (latestM1.low + spread) >= s.obLow) {\n            triggerBullish = true;\n            data.ask = latestM1.low + spread; // Mock ask for downstream logic\n        }\n        if (triggerBullish) {\n            const t0 = new Date().toISOString();";
code = code.replace(triggerBullishOld, triggerBullishNew);

const triggerBearishOld = "        else if (s.bias === 'BEARISH' && data.bid >= s.obLow && data.bid <= s.obHigh) {\n            const t0 = new Date().toISOString();";
const triggerBearishNew = "        else {\n            let triggerBearish = s.bias === 'BEARISH' && data.bid >= s.obLow && data.bid <= s.obHigh;\n            if (s.bias === 'BEARISH' && !triggerBearish && latestM1 && latestM1.high >= s.obLow && latestM1.high <= s.obHigh) {\n                triggerBearish = true;\n                data.bid = latestM1.high; // Mock bid for downstream logic\n            }\n            if (triggerBearish) {\n            const t0 = new Date().toISOString();";
code = code.replace(triggerBearishOld, triggerBearishNew);

// 5. Close the else block
const elseBlockOld = "        else {\n            // Setup is actively waiting for price to retrace into OB zone";
const elseBlockNew = "            }\n        else {\n            // Setup is actively waiting for price to retrace into OB zone";
code = code.replace(elseBlockOld, elseBlockNew);

fs.writeFileSync(file, code);
