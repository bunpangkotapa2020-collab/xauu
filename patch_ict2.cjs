const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// Replace the BUY execution block inside executeTrade
code = code.replace(
    /if \(s\.bias === 'BULLISH'\) \{[\s\S]*?this\.state\.executedSetupIds\.add\(s\.id\);\n\s*\}\n\s*else if \(s\.bias === 'BEARISH'\) \{[\s\S]*?this\.state\.executedSetupIds\.add\(s\.id\);\n\s*\}/,
    `if (s.bias === 'BULLISH') {
            entry = data.ask;
            sl = entry - 10.000;
            tp = entry + 10.000;
            
            this.log(\`SETUP READY FOR EXECUTION: BUY \${this.config.symbol} | Entry: \${entry} | SL: \${sl} | TP: \${tp} | Setup: \${s.id}\`);
            
            if (this.LIVE_TRADING_ENABLED) {
                try {
                    const t0 = new Date().toISOString();
                    this.log(\`\\n[ORDER DISPATCH]\\nORDER FUNCTION CALLED\`);
                    this.log(\`[\${t0}] EXECUTION TRIGGERED\`);
                    this.log(\`[\${new Date().toISOString()}] METAAPI REQUEST SENT\`);
                    
                    const tStart = Date.now();
                    const ticket = await this.execution.executeBuy(this.config.symbol, 0.02, sl, tp, 999, entry);
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
                            lot: 0.02,
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
            sl = entry + 10.000;
            tp = entry - 10.000;
            
            this.log(\`SETUP READY FOR EXECUTION: SELL \${this.config.symbol} | Entry: \${entry} | SL: \${sl} | TP: \${tp} | Setup: \${s.id}\`);
            
            if (this.LIVE_TRADING_ENABLED) {
                try {
                    const t0 = new Date().toISOString();
                    this.log(\`\\n[ORDER DISPATCH]\\nORDER FUNCTION CALLED\`);
                    this.log(\`[\${t0}] EXECUTION TRIGGERED\`);
                    this.log(\`[\${new Date().toISOString()}] METAAPI REQUEST SENT\`);
                    
                    const tStart = Date.now();
                    const ticket = await this.execution.executeSell(this.config.symbol, 0.02, sl, tp, 999, entry);
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
                            lot: 0.02,
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
        }`
);

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
