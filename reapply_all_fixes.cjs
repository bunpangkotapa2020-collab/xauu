const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// 1. EAConfig SL/TP Distance
if (!code.includes('stopLossDistance: number;')) {
    code = code.replace(/lotSize: number;/, 'lotSize: number;\n    stopLossDistance: number;\n    takeProfitDistance: number;');
}

// 2. Remove minRR Check
code = code.replace(/if \(rrEst >= this\.config\.minRR\) \{/, 'if (true) {');
code = code.replace(/this\.addAnalysisLog\(\`Setup Confirmed Notification Blocked: RR \$\{rrEst\.toFixed\(2\)\} < \$\{this\.config\.minRR\}\`, 'warn'\);/, '');

// 3. 3 Execution boxes removal and Execution Logic replacement
const newLogic = `        if (s.bias === 'BULLISH') {
            entry = data.ask;
            sl = entry - this.config.stopLossDistance;
            tp = entry + this.config.takeProfitDistance;
            
            this.log(\`SETUP READY FOR EXECUTION: BUY \${this.config.symbol} | Entry: \${entry} | SL: \${sl} | TP: \${tp} | Setup: \${s.id}\`);
            
            if (this.LIVE_TRADING_ENABLED) {
                try {
                    const t0 = new Date().toISOString();
                    this.log(\`\\n[ORDER DISPATCH]\\nORDER FUNCTION CALLED\`);
                    this.log(\`[\${t0}] EXECUTION TRIGGERED\`);
                    this.log(\`[\${new Date().toISOString()}] METAAPI REQUEST SENT\`);
                    
                    const tStart = Date.now();
                    const ticket = await this.execution.executeBuy(this.config.symbol, this.config.lotSize, sl, tp, 999, entry);
                    const tEnd = Date.now();
                    
                    this.log(\`[\${new Date(tEnd).toISOString()}] METAAPI RESPONSE RECEIVED | Latency: \${tEnd - tStart}ms\`);
                    this.log(\`BROKER RESPONSE: SUCCESS\\nPOSITION TICKET: \${ticket}\`);
                    this.log(\`[\${new Date().toISOString()}] 🟢 POSITION OPENED\`);
                    s.stage = 'EXECUTED';
                    s.executionTicket = ticket;
                    if (this.onExecutionSuccess) {
                        this.onExecutionSuccess({
                            setupId: s.id,
                            symbol: this.config.symbol,
                            direction: 'BUY',
                            entry: entry,
                            sl: sl,
                            tp: tp,
                            lot: this.config.lotSize,
                            ticket: ticket
                        });
                    }
                } catch (e: any) {
                    const tEnd = Date.now();
                    this.log(\`[\${new Date(tEnd).toISOString()}] METAAPI RESPONSE RECEIVED\`);
                    this.log(\`BROKER RESPONSE: ERROR - \${e.message}\`);
                    s.stage = 'REJECTED';
                    if (this.onExecutionFailed) {
                        this.onExecutionFailed({ setupId: s.id, reason: e.message });
                    }
                }
            } else {
                const reason = this.liveTradingBlockReason || 'BLOCKED_BY_SAFETY_SYSTEM';
                this.log(\`[BLOCKED] Valid setup reached entry but LIVE TRADING is disabled. Reason: \${reason}\`);
                s.stage = 'REJECTED';
            }
            this.state.executedSetupIds.add(s.id);
        }
        else if (s.bias === 'BEARISH') {
            entry = data.bid;
            sl = entry + this.config.stopLossDistance;
            tp = entry - this.config.takeProfitDistance;
            
            this.log(\`SETUP READY FOR EXECUTION: SELL \${this.config.symbol} | Entry: \${entry} | SL: \${sl} | TP: \${tp} | Setup: \${s.id}\`);
            
            if (this.LIVE_TRADING_ENABLED) {
                try {
                    const t0 = new Date().toISOString();
                    this.log(\`\\n[ORDER DISPATCH]\\nORDER FUNCTION CALLED\`);
                    this.log(\`[\${t0}] EXECUTION TRIGGERED\`);
                    this.log(\`[\${new Date().toISOString()}] METAAPI REQUEST SENT\`);
                    
                    const tStart = Date.now();
                    const ticket = await this.execution.executeSell(this.config.symbol, this.config.lotSize, sl, tp, 999, entry);
                    const tEnd = Date.now();
                    
                    this.log(\`[\${new Date(tEnd).toISOString()}] METAAPI RESPONSE RECEIVED | Latency: \${tEnd - tStart}ms\`);
                    this.log(\`BROKER RESPONSE: SUCCESS\\nPOSITION TICKET: \${ticket}\`);
                    this.log(\`[\${new Date().toISOString()}] 🟢 POSITION OPENED\`);
                    s.stage = 'EXECUTED';
                    s.executionTicket = ticket;
                    if (this.onExecutionSuccess) {
                        this.onExecutionSuccess({
                            setupId: s.id,
                            symbol: this.config.symbol,
                            direction: 'SELL',
                            entry: entry,
                            sl: sl,
                            tp: tp,
                            lot: this.config.lotSize,
                            ticket: ticket
                        });
                    }
                } catch (e: any) {
                    const tEnd = Date.now();
                    this.log(\`[\${new Date(tEnd).toISOString()}] METAAPI RESPONSE RECEIVED\`);
                    this.log(\`BROKER RESPONSE: ERROR - \${e.message}\`);
                    s.stage = 'REJECTED';
                    if (this.onExecutionFailed) {
                        this.onExecutionFailed({ setupId: s.id, reason: e.message });
                    }
                }
            } else {
                const reason = this.liveTradingBlockReason || 'BLOCKED_BY_SAFETY_SYSTEM';
                this.log(\`[BLOCKED] Valid setup reached entry but LIVE TRADING is disabled. Reason: \${reason}\`);
                s.stage = 'REJECTED';
            }
            this.state.executedSetupIds.add(s.id);
        }`;

// Replace lines 1026 to 1177 (0-indexed 1025 to 1176 in the old file) with newLogic
// Let's do string replacement instead of lines to be safe.
const targetStartIndex = code.indexOf("        if (s.bias === 'BULLISH') {");
const targetEndString = "        this.log(`========================================\\n`);\n    }";
const targetEndIndex = code.indexOf(targetEndString, targetStartIndex);

if (targetStartIndex !== -1 && targetEndIndex !== -1) {
    code = code.substring(0, targetStartIndex) + newLogic + "\n" + code.substring(targetEndIndex);
}

// 4. Update telemetry setting in update()
code = code.replace(/this\.telemetry\.validSetup\.sl = s\.lockedSlTarget;/g, "this.telemetry.validSetup.sl = s.bias === 'BULLISH' ? s.triggerTickPrice - this.config.stopLossDistance : s.triggerTickPrice + this.config.stopLossDistance;");
code = code.replace(/this\.telemetry\.validSetup\.tp = s\.lockedTpTarget;/g, "this.telemetry.validSetup.tp = s.bias === 'BULLISH' ? s.triggerTickPrice + this.config.takeProfitDistance : s.triggerTickPrice - this.config.takeProfitDistance;");

// 5. Bypass evaluateProfitLockTrailing cleanly. We just replace the body of evaluateProfitLockTrailing!
// find "public evaluateProfitLockTrailing(" and insert return immediately.
const plRegex = /public evaluateProfitLockTrailing\([\s\S]*?\) \{/;
code = code.replace(plRegex, (match) => {
    return match + "\n        return { newSl: null, isProfitLock: false, buffer: 0, volatility: 0, spread: 0 };\n";
});

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
