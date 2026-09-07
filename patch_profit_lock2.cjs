const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const regex = /public evaluateProfitLockTrailing\([\s\S]*?\([\s\S]*?\} \{[\s\S]*?DISABLED_BY_USER_REQUEST[\s\S]*?if \(\!pState\)/;
// Wait, I can just find the whole function and replace it.

let lines = code.split('\n');
let start = -1;
let end = -1;
let braces = 0;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('public evaluateProfitLockTrailing')) {
        start = i;
        braces = 0;
    }
    if (start !== -1) {
        braces += (lines[i].match(/\{/g) || []).length;
        braces -= (lines[i].match(/\}/g) || []).length;
        if (braces === 0) {
            end = i;
            break;
        }
    }
}
if (start !== -1 && end !== -1) {
    lines.splice(start, end - start + 1, `    public evaluateProfitLockTrailing(tradeId: string, currentPrice: number, tradeDetails: any, currentAtr: number, spread: number): { newSl: number | null; isProfitLock: boolean; buffer: number; volatility: number; spread: number } {
        return { newSl: null, isProfitLock: false, buffer: 0, volatility: 0, spread: spread };
    }`);
    fs.writeFileSync('src/MASTER_ICT_EA.ts', lines.join('\n'));
}
