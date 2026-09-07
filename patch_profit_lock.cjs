const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

code = code.replace(/public evaluateProfitLockTrailing\([\s\S]*?\) \{/, `public evaluateProfitLockTrailing(tradeId: string, currentPrice: number, tradeDetails: any, currentAtr: number, spread: number): { newSl: number | null; isProfitLock: boolean; buffer: number; volatility: number; spread: number } {
        return { newSl: null, isProfitLock: false, buffer: 0, volatility: 0, spread: spread };
        // DISABLED_BY_USER_REQUEST
`);

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
