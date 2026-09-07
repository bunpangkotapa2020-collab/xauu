const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf-8');

const regex = /if \(rightC\.low > leftC\.high\) \{\s*return \{\s*obHigh: obCandle\.high,\s*obLow: obCandle\.low,\s*fvgHigh: rightC\.low,\s*fvgLow: leftC\.high,\s*originTime: obCandle\.time\s*\};\s*\}/;
const replacement = `if (rightC.low > leftC.high) {
                        // VERIFY OB IS NOT ALREADY BROKEN BY SUBSEQUENT CANDLES
                        let isBroken = false;
                        for (let k = j + 2; k < N; k++) {
                            if (m1[k].low < obCandle.low) {
                                isBroken = true;
                                break;
                            }
                        }
                        if (!isBroken) {
                            return {
                                obHigh: obCandle.high,
                                obLow: obCandle.low,
                                fvgHigh: rightC.low,
                                fvgLow: leftC.high,
                                originTime: obCandle.time
                            };
                        }
                    }`;

code = code.replace(regex, replacement);

const regex2 = /if \(leftC\.low > rightC\.high\) \{\s*return \{\s*obHigh: obCandle\.high,\s*obLow: obCandle\.low,\s*fvgHigh: leftC\.low,\s*fvgLow: rightC\.high,\s*originTime: obCandle\.time\s*\};\s*\}/;
const replacement2 = `if (leftC.low > rightC.high) {
                        // VERIFY OB IS NOT ALREADY BROKEN BY SUBSEQUENT CANDLES
                        let isBroken = false;
                        for (let k = j + 2; k < N; k++) {
                            if (m1[k].high > obCandle.high) {
                                isBroken = true;
                                break;
                            }
                        }
                        if (!isBroken) {
                            return {
                                obHigh: obCandle.high,
                                obLow: obCandle.low,
                                fvgHigh: leftC.low,
                                fvgLow: rightC.high,
                                originTime: obCandle.time
                            };
                        }
                    }`;

code = code.replace(regex2, replacement2);

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
console.log('Successfully patched src/MASTER_ICT_EA.ts to check for historical breaks.');
