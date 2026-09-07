const fs = require('fs');
let content = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// BUY block
content = content.replace(
`        if (s.bias === 'BULLISH') {
            entry = data.ask;
            sl = s.obLow - 0.5; 
            
            const risk = entry - sl;
            // Removed unauthorized minSLPoints rejection gate
            tp = recentHigh;
            const reward = tp - entry;
            if (reward < this.config.minTPPoints) {
                this.log(\`🔴 EXECUTION BLOCKED | Reason: REJECTED: MIN_TP_VIOLATION (< \${this.config.minTPPoints})\`);
                s.executionState = \`REJECTED: MIN_TP_VIOLATION (< \${this.config.minTPPoints})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }

            const rr = reward / risk;
            if (rr < this.config.minRR) {
                this.log(\`🔴 EXECUTION BLOCKED | Reason: REJECTED: BAD_RR (\${rr.toFixed(2)} < \${this.config.minRR})\`);
                s.executionState = \`REJECTED: BAD_RR (\${rr.toFixed(2)} < \${this.config.minRR})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }
            
            this.log(\`SETUP READY FOR EXECUTION: BUY \${this.config.symbol} | Entry: \${entry} | SL: \${sl} | TP: \${tp} | Setup: \${s.id}\`);
            this.log(\`DETAILS | Risk: \${risk.toFixed(2)} | Reward: \${reward.toFixed(2)} | RR: \${rr.toFixed(2)} | Lot: \${this.config.lotSize}\`);
            
            if (this.LIVE_TRADING_ENABLED) {
                try {
                    s.executionState = 'ORDER_SENT';
                    this.log(\`🟢 ORDER FUNCTION CALLED\`);
                    this.log(\`🟢 METAAPI REQUEST SENT\`);
                    const ticket = await this.execution.executeBuy(this.config.symbol, this.config.lotSize, sl, tp, 999);
                    this.log(\`🟢 POSITION OPENED\`);
                    this.log(\`EXECUTE: BUY \${this.config.symbol} | Ticket: \${ticket}\`);
                    s.executionState = 'POSITION_OPENED';
                } catch (e: any) {
                    this.log(\`🔴 BROKER REJECTED | Error: \${e.message}\`);
                    s.executionState = \`REJECTED: BROKER_ERROR\`;
                }
            } else {
                this.log(\`🔴 EXECUTION BLOCKED | Reason: SAFE_MODE_ACTIVE\`);
                s.executionState = 'BLOCKED: SAFE_MODE_ACTIVE';
            }`,
`        if (s.bias === 'BULLISH') {
            entry = data.ask;
            sl = s.obLow - 0.5; 
            
            const risk = entry - sl;
            this.log(\`1. ENTRY_TRIGGERED | Setup: \${s.id} | Entry: \${entry}\`);
            this.log(\`2. RISK_CHECK_RESULT | Risk = \${risk.toFixed(2)} Points\`);

            tp = recentHigh;
            const reward = tp - entry;
            if (reward < this.config.minTPPoints) {
                this.log(\`❌ STOPPED AT: TP_CHECK\\nReason: REJECTED: MIN_TP_VIOLATION (< \${this.config.minTPPoints})\`);
                s.executionState = \`REJECTED: MIN_TP_VIOLATION (< \${this.config.minTPPoints})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }

            const rr = reward / risk;
            if (rr < this.config.minRR) {
                this.log(\`❌ STOPPED AT: RR_CHECK\\nReason: REJECTED: BAD_RR (\${rr.toFixed(2)} < \${this.config.minRR})\`);
                s.executionState = \`REJECTED: BAD_RR (\${rr.toFixed(2)} < \${this.config.minRR})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }
            this.log(\`3. RR_CHECK_RESULT | RR = \${rr.toFixed(2)} | PASSED\`);
            
            this.log(\`SETUP READY FOR EXECUTION: BUY \${this.config.symbol} | Entry: \${entry} | SL: \${sl} | TP: \${tp} | Setup: \${s.id}\`);
            this.log(\`DETAILS | Risk: \${risk.toFixed(2)} | Reward: \${reward.toFixed(2)} | RR: \${rr.toFixed(2)} | Lot: \${this.config.lotSize}\`);
            
            if (this.LIVE_TRADING_ENABLED) {
                this.log(\`4. EXECUTION_GATE_RESULT | LIVE_TRADING_ENABLED = TRUE\`);
                try {
                    s.executionState = 'ORDER_SENT';
                    this.log(\`5. ORDER_FUNCTION_CALLED\`);
                    const ticket = await this.execution.executeBuy(this.config.symbol, this.config.lotSize, sl, tp, 999);
                    this.log(\`EXECUTE: BUY \${this.config.symbol} | Ticket: \${ticket}\`);
                    s.executionState = 'POSITION_OPENED';
                } catch (e: any) {
                    this.log(\`❌ STOPPED AT: EXECUTION\\nReason: \${e.message}\`);
                    s.executionState = \`REJECTED: BROKER_ERROR\`;
                }
            } else {
                this.log(\`4. EXECUTION_GATE_RESULT | LIVE_TRADING_ENABLED = FALSE\`);
                this.log(\`❌ STOPPED AT: EXECUTION_GATE\\nReason: SAFE_MODE_ACTIVE\`);
                s.executionState = 'BLOCKED: SAFE_MODE_ACTIVE';
            }`
);

// SELL block
content = content.replace(
`        else if (s.bias === 'BEARISH') {
            entry = data.bid;
            sl = s.obHigh + 0.5;
            const risk = sl - entry;
            // Removed unauthorized minSLPoints rejection gate
            tp = recentLow;
            const reward = entry - tp;
            if (reward < this.config.minTPPoints) {
                this.log(\`🔴 EXECUTION BLOCKED | Reason: REJECTED: MIN_TP_VIOLATION (< \${this.config.minTPPoints})\`);
                s.executionState = \`REJECTED: MIN_TP_VIOLATION (< \${this.config.minTPPoints})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }

            const rr = reward / risk;
            if (rr < this.config.minRR) {
                this.log(\`🔴 EXECUTION BLOCKED | Reason: REJECTED: BAD_RR (\${rr.toFixed(2)} < \${this.config.minRR})\`);
                s.executionState = \`REJECTED: BAD_RR (\${rr.toFixed(2)} < \${this.config.minRR})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }
            
            this.log(\`SETUP READY FOR EXECUTION: SELL \${this.config.symbol} | Entry: \${entry} | SL: \${sl} | TP: \${tp} | Setup: \${s.id}\`);
            this.log(\`DETAILS | Risk: \${risk.toFixed(2)} | Reward: \${reward.toFixed(2)} | RR: \${rr.toFixed(2)} | Lot: \${this.config.lotSize}\`);
            
            if (this.LIVE_TRADING_ENABLED) {
                try {
                    s.executionState = 'ORDER_SENT';
                    this.log(\`🟢 ORDER FUNCTION CALLED\`);
                    this.log(\`🟢 METAAPI REQUEST SENT\`);
                    const ticket = await this.execution.executeSell(this.config.symbol, this.config.lotSize, sl, tp, 999);
                    this.log(\`🟢 POSITION OPENED\`);
                    this.log(\`EXECUTE: SELL \${this.config.symbol} | Ticket: \${ticket}\`);
                    s.executionState = 'POSITION_OPENED';
                } catch (e: any) {
                    this.log(\`🔴 BROKER REJECTED | Error: \${e.message}\`);
                    s.executionState = \`REJECTED: BROKER_ERROR\`;
                }
            } else {
                this.log(\`🔴 EXECUTION BLOCKED | Reason: SAFE_MODE_ACTIVE\`);
                s.executionState = 'BLOCKED: SAFE_MODE_ACTIVE';
            }`,
`        else if (s.bias === 'BEARISH') {
            entry = data.bid;
            sl = s.obHigh + 0.5;
            const risk = sl - entry;
            this.log(\`1. ENTRY_TRIGGERED | Setup: \${s.id} | Entry: \${entry}\`);
            this.log(\`2. RISK_CHECK_RESULT | Risk = \${risk.toFixed(2)} Points\`);

            tp = recentLow;
            const reward = entry - tp;
            if (reward < this.config.minTPPoints) {
                this.log(\`❌ STOPPED AT: TP_CHECK\\nReason: REJECTED: MIN_TP_VIOLATION (< \${this.config.minTPPoints})\`);
                s.executionState = \`REJECTED: MIN_TP_VIOLATION (< \${this.config.minTPPoints})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }

            const rr = reward / risk;
            if (rr < this.config.minRR) {
                this.log(\`❌ STOPPED AT: RR_CHECK\\nReason: REJECTED: BAD_RR (\${rr.toFixed(2)} < \${this.config.minRR})\`);
                s.executionState = \`REJECTED: BAD_RR (\${rr.toFixed(2)} < \${this.config.minRR})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }
            this.log(\`3. RR_CHECK_RESULT | RR = \${rr.toFixed(2)} | PASSED\`);
            
            this.log(\`SETUP READY FOR EXECUTION: SELL \${this.config.symbol} | Entry: \${entry} | SL: \${sl} | TP: \${tp} | Setup: \${s.id}\`);
            this.log(\`DETAILS | Risk: \${risk.toFixed(2)} | Reward: \${reward.toFixed(2)} | RR: \${rr.toFixed(2)} | Lot: \${this.config.lotSize}\`);
            
            if (this.LIVE_TRADING_ENABLED) {
                this.log(\`4. EXECUTION_GATE_RESULT | LIVE_TRADING_ENABLED = TRUE\`);
                try {
                    s.executionState = 'ORDER_SENT';
                    this.log(\`5. ORDER_FUNCTION_CALLED\`);
                    const ticket = await this.execution.executeSell(this.config.symbol, this.config.lotSize, sl, tp, 999);
                    this.log(\`EXECUTE: SELL \${this.config.symbol} | Ticket: \${ticket}\`);
                    s.executionState = 'POSITION_OPENED';
                } catch (e: any) {
                    this.log(\`❌ STOPPED AT: EXECUTION\\nReason: \${e.message}\`);
                    s.executionState = \`REJECTED: BROKER_ERROR\`;
                }
            } else {
                this.log(\`4. EXECUTION_GATE_RESULT | LIVE_TRADING_ENABLED = FALSE\`);
                this.log(\`❌ STOPPED AT: EXECUTION_GATE\\nReason: SAFE_MODE_ACTIVE\`);
                s.executionState = 'BLOCKED: SAFE_MODE_ACTIVE';
            }`
);

fs.writeFileSync('src/MASTER_ICT_EA.ts', content);
console.log("Patched MASTER_ICT_EA.ts");
