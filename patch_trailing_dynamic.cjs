const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
            if (trade.trailingActivated) {
                // Dynamic Trailing Distance based on Market Speed
                let trailMultiplier = 0.5; // NORMAL
                if (botState.marketSpeed === 'FAST') trailMultiplier = 0.8;
                if (botState.marketSpeed === 'EXTREME') trailMultiplier = 1.2;

                const trailDistance = riskDistance * trailMultiplier; 
                let potentialNewSl = trade.highestPriceReached - trailDistance;

                // Never move SL backward.
                if (potentialNewSl > trade.sl) {
                    newSl = Number(potentialNewSl.toFixed(2));
                    shouldTrail = true;
                }
            }
`;

const replacementSell = `
            if (trade.trailingActivated) {
                let trailMultiplier = 0.5; // NORMAL
                if (botState.marketSpeed === 'FAST') trailMultiplier = 0.8;
                if (botState.marketSpeed === 'EXTREME') trailMultiplier = 1.2;

                const trailDistance = riskDistance * trailMultiplier;
                let potentialNewSl = trade.lowestPriceReached + trailDistance;

                // Never move SL backward.
                if (potentialNewSl < trade.sl || trade.sl === 0) {
                    newSl = Number(potentialNewSl.toFixed(2));
                    shouldTrail = true;
                }
            }
`;

// Replace BUY trailing logic
const buyRegex = /if \(trade\.trailingActivated\) \{\s*\/\/ Lock profit and trail SL\.\s*\/\/ Distance to trail behind highest price \(e\.g\., 50% of risk distance\)\s*const trailDistance = riskDistance \* 0\.5;\s*let potentialNewSl = trade\.highestPriceReached - trailDistance;\s*\/\/ Never move SL backward\. SL must strictly be >= previous SL, and also > entryPrice \+ \(spread buffer\) if we want to lock profit\s*if \(potentialNewSl > trade\.sl\) \{\s*newSl = Number\(potentialNewSl\.toFixed\(2\)\);\s*shouldTrail = true;\s*\}\s*\}/m;
content = content.replace(buyRegex, replacement.trim());

// Replace SELL trailing logic
const sellRegex = /if \(trade\.trailingActivated\) \{\s*const trailDistance = riskDistance \* 0\.5;\s*let potentialNewSl = trade\.lowestPriceReached \+ trailDistance;\s*if \(potentialNewSl < trade\.sl \|\| trade\.sl === 0\) \{\s*newSl = Number\(potentialNewSl\.toFixed\(2\)\);\s*shouldTrail = true;\s*\}\s*\}/m;
content = content.replace(sellRegex, replacementSell.trim());

fs.writeFileSync('server.ts', content);
console.log('patched trailing logic for market speed');
