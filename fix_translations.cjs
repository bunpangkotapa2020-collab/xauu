const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const replacements = [
    {
        oldStr: "\\`H4 Bias = \\${bias} (Close: \\${lastH4Candle?.close || 0} | Open: \\${lastH4Candle?.open || 0})\\`, 'info'",
        newStr: "\\`H4 Bias (និន្នាការធំ) = \\${bias} (Close: \\${lastH4Candle?.close || 0} | Open: \\${lastH4Candle?.open || 0})\\`, 'info'"
    },
    {
        oldStr: "\\`M15 Liquidity Sweep = NOT FOUND (Current: \\${bias === 'BEARISH' ? m15_3?.high : m15_3?.low} vs Swing: \\${bias === 'BEARISH' ? m15_1?.high : m15_1?.low})\\`, 'warn'",
        newStr: "\\`M15 Liquidity Sweep = NOT FOUND / រកមិនទាន់ឃើញ (Current: \\${bias === 'BEARISH' ? m15_3?.high : m15_3?.low} vs Swing: \\${bias === 'BEARISH' ? m15_1?.high : m15_1?.low})\\`, 'warn'"
    },
    {
        oldStr: "\\`M15 CISD = WAITING\\`, 'info'",
        newStr: "\\`M15 CISD = WAITING / កំពុងរង់ចាំ\\`, 'info'"
    },
    {
        oldStr: "\\`M1 = LOCKED (Awaiting M15 Sweep Confirmation)\\`, 'info'",
        newStr: "\\`M1 = LOCKED / ជាប់សោរ (Awaiting M15 Sweep Confirmation / រង់ចាំការបញ្ជាក់ពី M15)\\`, 'info'"
    },
    {
        oldStr: "\\`ENTRY = WAITING (⏳ WAITING FOR M15 LIQUIDITY SWEEP)\\`, 'info'",
        newStr: "\\`ENTRY = WAITING (⏳ WAITING FOR M15 LIQUIDITY SWEEP / កំពុងរង់ចាំ M15 យក Liquidity)\\`, 'info'"
    },
    {
        oldStr: "this.telemetry.waitingReason = '⏳ WAITING FOR M15 LIQUIDITY SWEEP';",
        newStr: "this.telemetry.waitingReason = '⏳ WAITING FOR M15 LIQUIDITY SWEEP / កំពុងរង់ចាំ M15 យក Liquidity';"
    },
    {
        oldStr: "this.telemetry.waitingReason = '⏳ CISD CONFIRMED — WAITING FOR M1 DISPLACEMENT & OB/FVG';",
        newStr: "this.telemetry.waitingReason = '⏳ CISD CONFIRMED — WAITING FOR M1 DISPLACEMENT & OB/FVG / រង់ចាំ M1 ទម្លុះរចនាសម្ព័ន្ធ និងបង្កើត OB/FVG';"
    },
    {
        oldStr: "this.telemetry.waitingReason = '⏳ M1 OB FOUND — WAITING FOR RETRACEMENT';",
        newStr: "this.telemetry.waitingReason = '⏳ M1 OB FOUND — WAITING FOR RETRACEMENT / រកឃើញ M1 OB, កំពុងរង់ចាំតម្លៃត្រលប់មកវិញ';"
    },
    {
        oldStr: "\\`M15 Liquidity Sweep = FOUND (\\${bias === 'BEARISH' ? 'Buy-Side' : 'Sell-Side'} Liquidity Swept)\\`, 'success'",
        newStr: "\\`M15 Liquidity Sweep = FOUND / រកឃើញហើយ (\\${bias === 'BEARISH' ? 'Buy-Side' : 'Sell-Side'} Liquidity Swept)\\`, 'success'"
    },
    {
        oldStr: "\\`M15 CISD = CONFIRMED\\`, 'success'",
        newStr: "\\`M15 CISD = CONFIRMED / ត្រូវបានបញ្ជាក់ច្បាស់លាស់\\`, 'success'"
    },
    {
        oldStr: "\\`M1 Displacement & OB/FVG = WAITING\\`, 'warn'",
        newStr: "\\`M1 Displacement & OB/FVG = WAITING / កំពុងរង់ចាំ\\`, 'warn'"
    },
    {
        oldStr: "\\`M1 Order Block = FOUND [\\${obData.obLow} - \\${obData.obHigh}]\\`, 'success'",
        newStr: "\\`M1 Order Block = FOUND / រកឃើញហើយ [\\${obData.obLow} - \\${obData.obHigh}]\\`, 'success'"
    },
    {
        oldStr: "\\`M1 FVG = FOUND [\\${obData.fvgLow} - \\${obData.fvgHigh}]\\`, 'success'",
        newStr: "\\`M1 FVG = FOUND / រកឃើញហើយ [\\${obData.fvgLow} - \\${obData.fvgHigh}]\\`, 'success'"
    },
    {
        oldStr: "\\`ENTRY = VALID SETUP (⏳ WAITING FOR RETRACEMENT)\\`, 'success'",
        newStr: "\\`ENTRY = VALID SETUP / រកឃើញកន្លែងចូល (⏳ WAITING FOR RETRACEMENT / រង់ចាំតម្លៃត្រលប់មកវិញ)\\`, 'success'"
    }
];

for (const rep of replacements) {
    if (code.includes(rep.oldStr.replace(/\\`/g, '`'))) {
        code = code.replace(rep.oldStr.replace(/\\`/g, '`'), rep.newStr.replace(/\\`/g, '`'));
    } else {
        console.log("Could not find:", rep.oldStr);
    }
}

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
