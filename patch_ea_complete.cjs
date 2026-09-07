const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// 1. Config properties
if (!code.includes('stopLossDistance: number;')) {
    code = code.replace(/lotSize: number;/, 'lotSize: number;\n    stopLossDistance: number;\n    takeProfitDistance: number;');
}

// 2. Remove RR logic block
code = code.replace(/if \(rrEst >= this\.config\.minRR\) \{/, 'if (true) {');
code = code.replace(/this\.addAnalysisLog\(\`Setup Confirmed Notification Blocked: RR \$\{rrEst\.toFixed\(2\)\} < \$\{this\.config\.minRR\}\`, 'warn'\);/, '');

// 3. Update telemetry validSetup setting logic for TP and SL
code = code.replace(/this\.telemetry\.validSetup\.sl = s\.lockedSlTarget;/g, "this.telemetry.validSetup.sl = s.bias === 'BULLISH' ? s.triggerTickPrice - this.config.stopLossDistance : s.triggerTickPrice + this.config.stopLossDistance;");
code = code.replace(/this\.telemetry\.validSetup\.tp = s\.lockedTpTarget;/g, "this.telemetry.validSetup.tp = s.bias === 'BULLISH' ? s.triggerTickPrice + this.config.takeProfitDistance : s.triggerTickPrice - this.config.takeProfitDistance;");

// 4. Overwrite everything from `let sl = 0;` inside `executeTrade` to the end of the method!
const startMarker = "        let sl = 0;";
const endMarker = "        this.log(`========================================\\n`);\n    }";
const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker, startIdx);

const newExecuteLogic = `        let sl = 0;
        let tp = 0;
        let entry = 0;

        if (s.bias === 'BULLISH') {
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
        }
`;
if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newExecuteLogic + code.substring(endIdx);
}

// 5. Disable ProfitLock Trailing logic permanently inside its method body.
const plRegex = /public evaluateProfitLockTrailing\([\s\S]*?\} \{/;
code = code.replace(plRegex, (match) => {
    return match + "\n        return { newSl: null, isProfitLock: false, buffer: 0, volatility: 0, spread: spread };\n";
});

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
console.log("Patched successfully!");
