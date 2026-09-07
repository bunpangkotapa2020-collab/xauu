const fs = require('fs');
let code = fs.readFileSync('src/engines/dara_m1/DaRaM1Engine.ts.tmp', 'utf8');

const handlePosClosedStart = code.indexOf('public async handlePositionClosed(');
const handlePosClosedEnd = code.indexOf('private async finalizeTradeClose');

const before = code.substring(0, handlePosClosedStart);
let inside = code.substring(handlePosClosedStart, handlePosClosedEnd);
const after = code.substring(handlePosClosedEnd);

// Replace activePos with targetPos inside the method
inside = inside.replace(/activePos\./g, 'targetPos.');
// Wait, we also need to clear additionalPosition if it was closed
inside = inside.replace(
    'await this.finalizeTradeClose(closedTrade);',
    'if (isAdditional) this.additionalPosition = null;\n    else this.additionalEntryTriggered.delete(String(targetPos.ticket));\n    await this.finalizeTradeClose(closedTrade);'
);

fs.writeFileSync('src/engines/dara_m1/DaRaM1Engine.ts', before + inside + after);
