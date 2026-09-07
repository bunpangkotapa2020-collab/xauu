const fs = require('fs');

let ea = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// Add onExecutionSuccess to EA properties
ea = ea.replace(/public onExecutionFailed\?: \(data: \{/g, 
                "public onExecutionSuccess?: (data: {\n        setupId: string;\n        symbol: string;\n        direction: 'BUY' | 'SELL';\n        entry: number;\n        sl: number;\n        tp: number;\n        lot: number;\n        ticket: string;\n    }) => void;\n    public onExecutionFailed?: (data: {");

// Trigger onExecutionSuccess for BUY
ea = ea.replace(/s\.stage = 'EXECUTED';\n\s*s\.executionTicket = ticket;\n\s*\} catch \(e: any\)/g,
                "s.stage = 'EXECUTED';\n                    s.executionTicket = ticket;\n                    if (this.onExecutionSuccess) {\n                        this.onExecutionSuccess({\n                            setupId: s.id,\n                            symbol: this.config.symbol,\n                            direction: 'BUY',\n                            entry: entry,\n                            sl: sl,\n                            tp: tp,\n                            lot: this.config.lotSize,\n                            ticket: ticket\n                        });\n                    }\n                } catch (e: any)");

// Trigger onExecutionSuccess for SELL
ea = ea.replace(/s\.stage = 'EXECUTED';\n\s*s\.executionTicket = ticket;\n\s*\} catch \(e: any\)/g,
                "s.stage = 'EXECUTED';\n                    s.executionTicket = ticket;\n                    if (this.onExecutionSuccess) {\n                        this.onExecutionSuccess({\n                            setupId: s.id,\n                            symbol: this.config.symbol,\n                            direction: 'SELL',\n                            entry: entry,\n                            sl: sl,\n                            tp: tp,\n                            lot: this.config.lotSize,\n                            ticket: ticket\n                        });\n                    }\n                } catch (e: any)");

fs.writeFileSync('src/MASTER_ICT_EA.ts', ea);
console.log("TELE PATCH EA COMPLETE");
