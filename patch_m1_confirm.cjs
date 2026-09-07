const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const m15Success = `        // M15 Swept & CISD Confirmed
        this.addAnalysisLog(\`M15 Liquidity Sweep = FOUND / រកឃើញហើយ (\${bias === 'BEARISH' ? 'Buy-Side' : 'Sell-Side'} Liquidity Swept)\`, 'success');
        this.addAnalysisLog(\`M15 CISD = CONFIRMED / ត្រូវបានបញ្ជាក់ច្បាស់លាស់\`, 'success');`;

const m1Check = `        // M15 Swept & CISD Confirmed
        this.addAnalysisLog(\`M15 Liquidity Sweep = FOUND / រកឃើញហើយ (\${bias === 'BEARISH' ? 'Buy-Side' : 'Sell-Side'} Liquidity Swept)\`, 'success');
        this.addAnalysisLog(\`M15 CISD = CONFIRMED / ត្រូវបានបញ្ជាក់ច្បាស់លាស់\`, 'success');

        // M1 Confirmation
        let m1Confirmed = false;
        if (data.m1Candles && data.m1Candles.length > 0) {
            const lastM1 = data.m1Candles[data.m1Candles.length - 1];
            if (bias === 'BULLISH' && lastM1.close > lastM1.open) m1Confirmed = true;
            if (bias === 'BEARISH' && lastM1.close < lastM1.open) m1Confirmed = true;
        }

        if (!m1Confirmed) {
            this.telemetry.m1 = {
                displacement: 'WAITING',
                orderBlock: 'WAITING',
                fvg: 'WAITING',
                retracement: 'WAITING',
                obZone: null,
                fvgZone: null,
                candleCount: data.m1Candles?.length || 0,
                lastCandleTime: data.m1Candles?.length ? new Date(data.m1Candles[data.m1Candles.length-1].time).toISOString() : undefined
            };
            this.telemetry.entryStatus = 'WAITING';
            this.telemetry.waitingReason = '⏳ WAITING FOR M1 CONFIRMATION / រង់ចាំ M1 បញ្ជាក់ទិសដៅ';
            this.telemetry.validSetup = null;
            this.addAnalysisLog(\`M1 = WAITING / កំពុងរង់ចាំបញ្ជាក់ទិសដៅ (\${bias})\`, 'warn');
            return;
        }
        this.addAnalysisLog(\`M1 = CONFIRMED / ត្រូវបានបញ្ជាក់ទិសដៅ (\${bias})\`, 'success');
`;

code = code.replace(m15Success, m1Check);
fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
console.log("Patched M1 Confirmation in EA.");
