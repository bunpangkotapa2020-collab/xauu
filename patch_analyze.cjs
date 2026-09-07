const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

let startIndex = code.indexOf('        // M15 Swept & CISD Confirmed');
let endIndex = code.indexOf('    private detectDynamicOrderBlock');
if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find boundaries.");
    process.exit(1);
}

let newCode = `        // M15 Swept & CISD Confirmed
        this.addAnalysisLog(\`M15 Liquidity Sweep = FOUND / រកឃើញហើយ (\${bias === 'BEARISH' ? 'Buy-Side' : 'Sell-Side'} Liquidity Swept)\`, 'success');
        this.addAnalysisLog(\`M15 CISD = CONFIRMED / ត្រូវបានបញ្ជាក់ច្បាស់លាស់\`, 'success');

        const setupId = \`\${this.config.symbol}-\${bias}-M15Sweep-\${m15_3.time}\`;
        
        if (this.state.executedSetupIds.has(setupId)) {
            return;
        }

        // ENTRY: LOCKED based on M15 Swing
        const entryEst = bias === 'BULLISH' ? m15_1.low : m15_1.high; 
        
        // SINGLE SOURCE OF TRUTH: User Settings distances
        let slEst = bias === 'BULLISH' ? (entryEst - this.config.stopLossDistance) : (entryEst + this.config.stopLossDistance);
        let tpEst = bias === 'BULLISH' ? (entryEst + this.config.takeProfitDistance) : (entryEst - this.config.takeProfitDistance);

        const riskEst = Math.abs(entryEst - slEst);
        const rewardEst = Math.abs(tpEst - entryEst);
        const rrEst = riskEst > 0 ? rewardEst / riskEst : 0;

        this.state.currentSetup = {
            id: setupId,
            stage: 'WAITING',
            bias: bias,
            lockedEntryPrice: entryEst,
            h4BiasConfirmed: true,
            m15LiquiditySwept: true,
            m15CISDConfirmed: true,
            lockedSlTarget: slEst,
            lockedTpTarget: tpEst,
            firstTouch: 'NONE',
            creationTime: data.serverTime,
            expirationTime: data.serverTime + (4 * 3600000), // 4 hours
            confirmationAlertSent: true,
            obHigh: entryEst,
            obLow: entryEst,
            fvgHigh: entryEst,
            fvgLow: entryEst,
            m1DisplacementConfirmed: true,
            m1OBConfirmed: true,
            m1FVGConfirmed: true,
            retracementConfirmed: true
        };

        if (this.onSetupConfirmed) {
            this.onSetupConfirmed({
                symbol: data.symbol || this.config.symbol,
                direction: bias === 'BULLISH' ? 'BUY' : 'SELL',
                entryZone: { low: entryEst, high: entryEst },
                actualEntry: entryEst,
                sl: slEst,
                tp: tpEst,
                rr: Number(rrEst.toFixed(2)),
                status: '⏳ FULL SETUP READY - WAITING FOR ENTRY'
            });
        }

        this.telemetry.entryStatus = 'VALID SETUP';
        this.telemetry.waitingReason = '⏳ FULL SETUP READY — WAITING FOR ENTRY / រង់ចាំតម្លៃមកដល់ Entry';
        
        this.telemetry.validSetup = {
            direction: bias === 'BULLISH' ? 'BUY' : 'SELL',
            entry: entryEst,
            actualEntry: entryEst,
            sl: slEst,
            tp: tpEst,
            rr: Number(rrEst.toFixed(2)),
            setupId: setupId,
            stage: 'WAITING',
            executionState: undefined,
            obHigh: entryEst,
            obLow: entryEst
        };
        
        this.log(\`SEQUENCE COMPLETE: Valid \${bias} Setup. Locked Entry: \${entryEst} | SL: \${slEst} | TP: \${tpEst} (RR: \${rrEst.toFixed(2)}). Stage -> WAITING\`);
        this.addAnalysisLog(\`FULL SETUP READY | Locked Entry = \${entryEst}\`, 'success');
        this.addAnalysisLog(\`Structural SL = \${slEst} | Locked ICT TP = \${tpEst} (RR: \${rrEst.toFixed(2)})\`, 'info');
        this.addAnalysisLog(\`ENTRY = VALID SETUP / រកឃើញកន្លែងចូល (⏳ WAITING FOR ENTRY TOUCH / រង់ចាំតម្លៃប៉ះ Entry)\`, 'success');
    }

`;

code = code.substring(0, startIndex) + newCode + code.substring(endIndex);

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
console.log("Replaced analyzeSequence part 1");
