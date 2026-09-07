const fs = require('fs');
const file = 'src/MASTER_ICT_EA.ts';
let code = fs.readFileSync(file, 'utf8');

// Use regex to replace the entire validateRetracement function
const regex = /private validateRetracement\(data: ICTMarketData\) \{[\s\S]*?\n    \}\n    public LIVE_TRADING_ENABLED = false;/;

const newFunc = `private validateRetracement(data: ICTMarketData) {
        const s = this.state.currentSetup!;
        
        const latestM1 = data.m1Candles && data.m1Candles.length > 0 ? data.m1Candles[data.m1Candles.length - 1] : null;
        const spread = data.ask - data.bid;
        const latestM1AskHigh = latestM1 ? latestM1.high + spread : data.ask;

        const isBullishInvalidated = s.bias === 'BULLISH' && (data.bid < (s.obLow - 0.1) || (latestM1 && latestM1.low < (s.obLow - 0.1)));
        const isBearishInvalidated = s.bias === 'BEARISH' && (data.ask > (s.obHigh + 0.1) || (latestM1 && latestM1AskHigh > (s.obHigh + 0.1)));

        if (isBullishInvalidated) {
            this.log(\`=== RETRACEMENT DIAGNOSTIC (BULLISH) ===\`);
            this.log(\`Setup ID: \${s.id}\`);
            this.log(\`Direction: \${s.bias}\`);
            this.log(\`OB High: \${s.obHigh}\`);
            this.log(\`OB Low: \${s.obLow}\`);
            this.log(\`Current Ask: \${data.ask}\`);
            this.log(\`Current Bid: \${data.bid}\`);
            this.log(\`Condition: data.bid < (s.obLow - 0.1) (\${data.bid} < \${(s.obLow - 0.1).toFixed(3)}) => TRUE\`);
            this.log(\`========================================\`);
            this.log(\`INVALID OB/SETUP: Price broke below Bullish OB Low (\${s.obLow}). Stage -> INVALIDATED\`);
            this.addAnalysisLog(\`Setup \${s.id} បានបរាជ័យ (Price broke below OB Low \${s.obLow} - Bid was \${data.bid}) -> INVALIDATED\`, 'warn');
            s.executionState = 'REJECTED: PRICE_BROKE_OB';
            s.stage = 'INVALIDATED';
            this.state.executedSetupIds.add(s.id);
            return;
        }

        if (isBearishInvalidated) {
            this.log(\`=== RETRACEMENT DIAGNOSTIC (BEARISH) ===\`);
            this.log(\`Setup ID: \${s.id}\`);
            this.log(\`Direction: \${s.bias}\`);
            this.log(\`OB High: \${s.obHigh}\`);
            this.log(\`OB Low: \${s.obLow}\`);
            this.log(\`Current Ask: \${data.ask}\`);
            this.log(\`Current Bid: \${data.bid}\`);
            this.log(\`Condition: data.ask > (s.obHigh + 0.1) (\${data.ask} > \${(s.obHigh + 0.1).toFixed(3)}) => TRUE\`);
            this.log(\`========================================\`);
            this.log(\`INVALID OB/SETUP: Price broke above Bearish OB High (\${s.obHigh}). Stage -> INVALIDATED\`);
            this.addAnalysisLog(\`Setup \${s.id} បានបរាជ័យ (Price broke above OB High \${s.obHigh} - Ask was \${data.ask}) -> INVALIDATED\`, 'warn');
            s.executionState = 'REJECTED: PRICE_BROKE_OB';
            s.stage = 'INVALIDATED';
            this.state.executedSetupIds.add(s.id);
            return;
        }

        // =========================================================================
        // PRE-ENTRY SETUP CANCELLATION ENGINE - TRUE EVENT-ORDER TRACKING
        // =========================================================================
        const lockedEntry = s.actualEntryPrice || (s.bias === 'BULLISH' ? s.obHigh : s.obLow);
        const lockedTp = s.lockedTpTarget !== undefined ? s.lockedTpTarget : (s.bias === 'BULLISH' ? Math.max(...(data.m1Candles || []).slice(-20).map(c=>c.high)) : Math.min(...(data.m1Candles || []).slice(-20).map(c=>c.low)));
        
        if (lockedTp !== undefined && lockedTp !== null && lockedEntry !== undefined && lockedEntry !== null) {
            let entryTouched = false;
            let tpTouched = false;
            if (s.bias === 'BULLISH') {
                entryTouched = data.ask <= lockedEntry || (latestM1 && (latestM1.low + spread) <= lockedEntry) ? true : false;
                tpTouched = Math.max(data.bid, data.ask) >= lockedTp || (latestM1 && latestM1.high >= lockedTp) ? true : false;
            } else {
                entryTouched = data.bid >= lockedEntry || (latestM1 && latestM1.high >= lockedEntry) ? true : false;
                tpTouched = Math.min(data.bid, data.ask) <= lockedTp || (latestM1 && latestM1.low <= lockedTp) ? true : false;
            }

            if (s.firstTouch === 'NONE' || !s.firstTouch || s.firstTouch === 'UNKNOWN') {
                if (entryTouched && tpTouched) {
                    s.firstTouch = 'UNKNOWN';
                    s.firstTouchTimestamp = data.serverTime;
                    this.log(\`\\n========================================\`);
                    this.log(\`[SETUP EVENT ORDER]\`);
                    this.log(\`Setup ID: \${s.id}\`);
                    this.log(\`Direction: \${s.bias === 'BULLISH' ? 'BUY' : 'SELL'}\`);
                    this.log(\`Entry: \${lockedEntry.toFixed(3)} | Locked TP: \${lockedTp.toFixed(3)}\`);
                    this.log(\`Live BID: \${data.bid.toFixed(3)} | Live ASK: \${data.ask.toFixed(3)}\`);
                    this.log(\`Entry Touched: YES | TP Touched: YES\`);
                    this.log(\`First Touch: UNKNOWN (Ambiguous tick)\`);
                    this.log(\`Decision: KEEP_WAITING\`);
                    this.log(\`🟡 TOUCH_ORDER_UNKNOWN — SETUP PRESERVED\`);
                    this.log(\`========================================\`);
                    return;
                } else if (tpTouched) {
                    s.firstTouch = 'TP';
                    s.firstTouchPrice = s.bias === 'BULLISH' ? data.bid : data.ask;
                    s.tpTouchedTimestamp = data.serverTime;
                    s.firstTouchTimestamp = data.serverTime;
                    
                    this.log(\`\\n========================================\`);
                    this.log(\`[SETUP EVENT ORDER]\`);
                    this.log(\`Setup ID: \${s.id}\`);
                    this.log(\`Direction: \${s.bias === 'BULLISH' ? 'BUY' : 'SELL'}\`);
                    this.log(\`Entry: \${lockedEntry.toFixed(3)} | Locked TP: \${lockedTp.toFixed(3)}\`);
                    this.log(\`Live BID: \${data.bid.toFixed(3)} | Live ASK: \${data.ask.toFixed(3)}\`);
                    this.log(\`Entry Touched: NO | TP Touched: YES\`);
                    this.log(\`TP Timestamp: \${data.serverTime}\`);
                    this.log(\`First Touch: TP\`);
                    this.log(\`Decision: CANCEL PERMANENTLY\`);
                    this.log(\`🔴 TP_REACHED_BEFORE_ENTRY\`);
                    this.log(\`========================================\`);
                    this.addAnalysisLog(\`⚠️ Setup \${s.id} ត្រូវបានលុបចោលភ្លាមៗ (TP REACHED BEFORE ENTRY): តម្លៃបានដល់ TP \${lockedTp} មុនពេលប៉ះ Entry -> Old Entry \${lockedEntry} ត្រូវបានបិទជាអចិន្ត្រៃយ៍\`, 'warn');
                    s.isStale = true;
                    s.stage = 'INVALIDATED';
                    s.executionState = 'REJECTED: TP_REACHED_BEFORE_ENTRY';
                    this.state.executedSetupIds.add(s.id);
                    
                    if (this.telemetry.validSetup) {
                        this.telemetry.validSetup.stage = 'INVALIDATED';
                        this.telemetry.validSetup.executionState = 'REJECTED: TP_REACHED_BEFORE_ENTRY';
                    }
                    this.telemetry.waitingReason = \`⚠️ OLD SETUP CANCELLED (TP reached before Entry) — Waiting for NEW ICT Setup\`;
                    return;
                } else if (entryTouched) {
                    s.firstTouch = 'ENTRY';
                    s.firstTouchPrice = s.bias === 'BULLISH' ? data.ask : data.bid;
                    s.entryTouchedTimestamp = data.serverTime;
                    s.firstTouchTimestamp = data.serverTime;
                    this.log(\`\\n========================================\`);
                    this.log(\`[SETUP EVENT ORDER]\`);
                    this.log(\`Setup ID: \${s.id}\`);
                    this.log(\`Direction: \${s.bias === 'BULLISH' ? 'BUY' : 'SELL'}\`);
                    this.log(\`Entry: \${lockedEntry.toFixed(3)} | Locked TP: \${lockedTp.toFixed(3)}\`);
                    this.log(\`Live BID: \${data.bid.toFixed(3)} | Live ASK: \${data.ask.toFixed(3)}\`);
                    this.log(\`Entry Touched: YES | TP Touched: NO\`);
                    this.log(\`Entry Timestamp: \${data.serverTime}\`);
                    this.log(\`First Touch: ENTRY\`);
                    this.log(\`Decision: EXECUTE\`);
                    this.log(\`🟢 ENTRY_REACHED_BEFORE_TP\`);
                    this.log(\`========================================\`);
                }
            } else if (s.firstTouch === 'TP') {
                return;
            }
        }

        let triggerBullish = s.bias === 'BULLISH' && data.ask <= s.obHigh && data.ask >= s.obLow;
        if (s.bias === 'BULLISH' && !triggerBullish && latestM1 && (latestM1.low + spread) <= s.obHigh && (latestM1.low + spread) >= s.obLow) {
            triggerBullish = true;
            data.ask = latestM1.low + spread; 
        }

        let triggerBearish = s.bias === 'BEARISH' && data.bid >= s.obLow && data.bid <= s.obHigh;
        if (s.bias === 'BEARISH' && !triggerBearish && latestM1 && latestM1.high >= s.obLow && latestM1.high <= s.obHigh) {
            triggerBearish = true;
            data.bid = latestM1.high;
        }

        if (triggerBullish) {
            const t0 = new Date().toISOString();
            this.log(\`\\n========================================\\n[ENTRY TRIGGER]\\n[\${t0}] SIGNAL CREATED\\nSetup ID: \${s.id}\\nDirection: BUY\\nEntry: \${data.ask}\\nCurrent Price: \${data.ask}\\nOB Zone: [\${s.obLow} - \${s.obHigh}]\\n========================================\`);
            this.log("WAITING FOR RETRACEMENT fulfilled. M1 Retracement into valid OB confirmed.");
            this.addAnalysisLog(\`M1 Retracement បានចូលក្នុងតំបន់ OB [\${s.obLow} - \${s.obHigh}] ជោគជ័យ -> TRIGGERED\`, 'success');
            
            s.actualEntryPrice = data.ask;
            s.lockedSlTarget = s.lockedSlTarget || (s.obLow - 0.5);
            s.lockedTpTarget = s.lockedTpTarget || Math.max(...(data.m1Candles||[]).slice(-20).map(c=>c.high));
            s.retracementConfirmed = true;
            s.stage = 'TRIGGERED';
            
            if (this.telemetry.validSetup) {
                this.telemetry.validSetup.stage = 'TRIGGERED';
                this.telemetry.validSetup.actualEntry = s.actualEntryPrice;
                this.telemetry.validSetup.sl = s.lockedSlTarget;
                this.telemetry.validSetup.tp = s.lockedTpTarget;
                const risk = Math.abs(s.actualEntryPrice - s.lockedSlTarget);
                const reward = Math.abs(s.lockedTpTarget - s.actualEntryPrice);
                this.telemetry.validSetup.rr = risk > 0 ? Number((reward / risk).toFixed(2)) : 0;
            }
            if (this.onActualEntryTriggered && !s.entryAlertSent) {
                s.entryAlertSent = true;
                this.onActualEntryTriggered({
                    setupId: s.id,
                    symbol: data.symbol || this.config.symbol,
                    direction: 'BUY',
                    entry: s.actualEntryPrice,
                    sl: s.lockedSlTarget,
                    tp: s.lockedTpTarget,
                    rr: this.telemetry.validSetup?.rr,
                    status: 'ENTRY TRIGGERED'
                });
            }
        }
        else if (triggerBearish) {
            const t0 = new Date().toISOString();
            this.log(\`\\n========================================\\n[ENTRY TRIGGER]\\n[\${t0}] SIGNAL CREATED\\nSetup ID: \${s.id}\\nDirection: SELL\\nEntry: \${data.bid}\\nCurrent Price: \${data.bid}\\nOB Zone: [\${s.obLow} - \${s.obHigh}]\\n========================================\`);
            this.log("WAITING FOR RETRACEMENT fulfilled. M1 Retracement into valid OB confirmed.");
            this.addAnalysisLog(\`M1 Retracement បានចូលក្នុងតំបន់ OB [\${s.obLow} - \${s.obHigh}] ជោគជ័យ -> TRIGGERED\`, 'success');
            
            s.actualEntryPrice = data.bid;
            s.lockedSlTarget = s.lockedSlTarget || (s.obHigh + 0.5);
            s.lockedTpTarget = s.lockedTpTarget || Math.min(...(data.m1Candles||[]).slice(-20).map(c=>c.low));
            s.retracementConfirmed = true;
            s.stage = 'TRIGGERED';
            
            if (this.telemetry.validSetup) {
                this.telemetry.validSetup.stage = 'TRIGGERED';
                this.telemetry.validSetup.actualEntry = s.actualEntryPrice;
                this.telemetry.validSetup.sl = s.lockedSlTarget;
                this.telemetry.validSetup.tp = s.lockedTpTarget;
                const risk = Math.abs(s.lockedSlTarget - s.actualEntryPrice);
                const reward = Math.abs(s.actualEntryPrice - s.lockedTpTarget);
                this.telemetry.validSetup.rr = risk > 0 ? Number((reward / risk).toFixed(2)) : 0;
            }
            if (this.onActualEntryTriggered && !s.entryAlertSent) {
                s.entryAlertSent = true;
                this.onActualEntryTriggered({
                    setupId: s.id,
                    symbol: data.symbol || this.config.symbol,
                    direction: 'SELL',
                    entry: s.actualEntryPrice,
                    sl: s.lockedSlTarget,
                    tp: s.lockedTpTarget,
                    rr: this.telemetry.validSetup?.rr,
                    status: 'ENTRY TRIGGERED'
                });
            }
        }
        else {
            this.telemetry.entryStatus = 'VALID SETUP';
            this.telemetry.waitingReason = \`⏳ SETUP VALID — កំពុងរង់ចាំ RETRACEMENT ចូលតំបន់ OB [\${s.obLow} - \${s.obHigh}]\`;
            
            const currentPrice = s.bias === 'BULLISH' ? data.ask : data.bid;
            const dist = s.bias === 'BULLISH' ? (currentPrice - s.obHigh) : (s.obLow - currentPrice);
            const distStr = dist > 0 ? \` (នៅឆ្ងាយ \${dist.toFixed(1)} Pts ពី OB)\` : '';
            this.addAnalysisLog(\`🟢 EA កំពុងធ្វើការ | ⏳ Setup រកឃើញ | ⏳ កំពុងរង់ចាំ Retracement\${distStr} | 🔄 Analysis កំពុងបន្ត\`, 'info');
        }
    }
    public LIVE_TRADING_ENABLED = false;`;

code = code.replace(regex, newFunc);
fs.writeFileSync(file, code);
