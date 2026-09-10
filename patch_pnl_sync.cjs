const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const originalLogic = `        let dailyRealized = 0;
        for (const deal of allDeals) {
            if (Number(deal.magic) === botState.magicNumber) {
                const profit = Number(deal.profit || 0);
                const commission = Number(deal.commission || 0);
                const swap = Number(deal.swap || 0);
                const fee = Number(deal.fee || 0);
                dailyRealized += (profit + commission + swap + fee);
            }
        }`;

const newLogic = `        let dailyRealized = 0;
        let tCount = 0;
        let wCount = 0;
        let lCount = 0;

        for (const deal of allDeals) {
            if (Number(deal.magic) === botState.magicNumber) {
                const profit = Number(deal.profit || 0);
                const commission = Number(deal.commission || 0);
                const swap = Number(deal.swap || 0);
                const fee = Number(deal.fee || 0);
                const net = profit + commission + swap + fee;
                
                dailyRealized += net;

                // MetaApi marks closing trades as DEAL_ENTRY_OUT or DEAL_ENTRY_INOUT
                // Also ignore balance operations
                if (deal.type !== 'DEAL_TYPE_BALANCE' && deal.entryType !== 'DEAL_ENTRY_IN') {
                    tCount++;
                    if (net >= 0) wCount++;
                    else lCount++;
                }
            }
        }
        
        botState.todayTradeCount = tCount;
        botState.todayWinCount = wCount;
        botState.todayLossCount = lCount;`;

code = code.replace(originalLogic, newLogic);
fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
