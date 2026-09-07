const fs = require('fs');
const file = 'src/MASTER_ICT_EA.ts';
let code = fs.readFileSync(file, 'utf8');

const triggerBullishOld = "if (s.bias === 'BULLISH' && data.ask <= s.obHigh && data.ask >= s.obLow) {";
const triggerBullishNew = "let triggerBullish = s.bias === 'BULLISH' && data.ask <= s.obHigh && data.ask >= s.obLow;\n        if (s.bias === 'BULLISH' && !triggerBullish && data.m1Candles && data.m1Candles.length > 0) {\n            const m1 = data.m1Candles[data.m1Candles.length - 1];\n            const spread = data.ask - data.bid;\n            if (m1.low + spread <= s.obHigh) triggerBullish = true;\n        }\n\n        if (triggerBullish) {";

code = code.replace(triggerBullishOld, triggerBullishNew);

const triggerBearishOld = "else if (s.bias === 'BEARISH' && data.bid >= s.obLow && data.bid <= s.obHigh) {";
const triggerBearishNew = "else { \n            let triggerBearish = s.bias === 'BEARISH' && data.bid >= s.obLow && data.bid <= s.obHigh;\n            if (s.bias === 'BEARISH' && !triggerBearish && data.m1Candles && data.m1Candles.length > 0) {\n                const m1 = data.m1Candles[data.m1Candles.length - 1];\n                if (m1.high >= s.obLow) triggerBearish = true;\n            }\n            if (triggerBearish) {";

code = code.replace(triggerBearishOld, triggerBearishNew);

// Fix the else branch that was replaced
const elseBranchOld = "else {\n            // Setup is actively waiting for price to retrace into OB zone";
const elseBranchNew = "else {\n            // Setup is actively waiting for price to retrace into OB zone";
// Wait, the else branch will now be inside the `else {` block we created? No, we need to match the curly braces.
