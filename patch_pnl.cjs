const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetLogic = `        for (const deal of allDeals) {
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
        }`;

const newLogic = `        for (const deal of allDeals) {
            // Include both bot trades (magic === 778899) and manual user trades (magic === 0 or undefined)
            // But skip other bots if they use different magic numbers
            const magicNum = Number(deal.magic || 0);
            if (magicNum === botState.magicNumber || magicNum === 0) {
                const profit = Number(deal.profit || 0);
                const commission = Number(deal.commission || 0);
                const swap = Number(deal.swap || 0);
                const fee = Number(deal.fee || 0);
                const net = profit + commission + swap + fee;
                
                // Exclude pure balance operations like deposits/withdrawals
                if (deal.type !== 'DEAL_TYPE_BALANCE') {
                    dailyRealized += net;

                    // Count only closed trades for win/loss stats
                    if (deal.entryType !== 'DEAL_ENTRY_IN') {
                        tCount++;
                        if (net >= 0) wCount++;
                        else lCount++;
                    }
                }
            }
        }`;

if (code.includes(targetLogic)) {
    code = code.replace(targetLogic, newLogic);
    fs.writeFileSync('server.ts', code);
    console.log("Patched server.ts successfully");
} else {
    console.log("Target logic not found");
}
