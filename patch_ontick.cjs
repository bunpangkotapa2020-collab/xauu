const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const target = `        if (this.state.currentSetup && this.state.currentSetup.stage === 'WAITING') {
            this.validateRetracement(data);
        }`;

const replacement = `        // Trigger execution when price touches the locked entry
        if (this.state.currentSetup && this.state.currentSetup.stage === 'WAITING') {
            const s = this.state.currentSetup;
            const dynamicEntry = s.lockedEntryPrice || (s.bias === 'BULLISH' ? s.obHigh : s.obLow);
            
            let entryTouched = false;
            // Strictly use real-time ticks
            if (s.bias === 'BULLISH') {
                entryTouched = data.ask <= dynamicEntry;
            } else {
                entryTouched = data.bid >= dynamicEntry;
            }
            
            if (entryTouched) {
                const t0 = new Date().toISOString();
                this.log(\`\\n========================================\\n[ENTRY TRIGGER]\\n[\${t0}] SIGNAL CREATED\\nSetup ID: \${s.id}\\nDirection: \${s.bias}\\nLocked Entry: \${dynamicEntry}\\nCurrent Price: \${s.bias === 'BULLISH' ? data.ask : data.bid}\\n========================================\`);
                this.log("WAITING FOR ENTRY fulfilled. Market Price reached Locked Entry.");
                this.addAnalysisLog(\`តម្លៃបានប៉ះចំនុច Entry គោលដៅ 🎯 -> TRIGGERED\`, 'success');
                
                s.triggerTickPrice = s.bias === 'BULLISH' ? data.ask : data.bid;
                s.stage = 'TRIGGERED';
                
                if (this.telemetry.validSetup) {
                    this.telemetry.validSetup.stage = 'TRIGGERED';
                    this.telemetry.validSetup.actualEntry = dynamicEntry;
                }
                
                if (this.onActualEntryTriggered && !s.entryAlertSent) {
                    s.entryAlertSent = true;
                    this.onActualEntryTriggered({
                        setupId: s.id,
                        symbol: data.symbol || this.config.symbol,
                        direction: s.bias === 'BULLISH' ? 'BUY' : 'SELL',
                        entry: dynamicEntry,
                        sl: s.lockedSlTarget!,
                        tp: s.lockedTpTarget!,
                        rr: this.telemetry.validSetup?.rr,
                        status: 'ENTRY TRIGGERED'
                    });
                }
            }
        }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
console.log("Replaced onTick validation");
