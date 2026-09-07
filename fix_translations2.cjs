const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

code = code.replace("this.addAnalysisLog(`H4 Bias = ${bias} (Close: ${lastH4Candle?.close || 0} | Open: ${lastH4Candle?.open || 0})`, 'info');", "this.addAnalysisLog(`H4 Bias (និន្នាការធំ) = ${bias} (Close: ${lastH4Candle?.close || 0} | Open: ${lastH4Candle?.open || 0})`, 'info');");
code = code.replace("this.addAnalysisLog(`M15 Liquidity Sweep = NOT FOUND (Current: ${bias === 'BEARISH' ? m15_3?.high : m15_3?.low} vs Swing: ${bias === 'BEARISH' ? m15_1?.high : m15_1?.low})`, 'warn');", "this.addAnalysisLog(`M15 Liquidity Sweep = NOT FOUND / រកមិនទាន់ឃើញ (Current: ${bias === 'BEARISH' ? m15_3?.high : m15_3?.low} vs Swing: ${bias === 'BEARISH' ? m15_1?.high : m15_1?.low})`, 'warn');");
code = code.replace("this.addAnalysisLog(`M15 Liquidity Sweep = FOUND (${bias === 'BEARISH' ? 'Buy-Side' : 'Sell-Side'} Liquidity Swept)`, 'success');", "this.addAnalysisLog(`M15 Liquidity Sweep = FOUND / រកឃើញហើយ (${bias === 'BEARISH' ? 'Buy-Side' : 'Sell-Side'} Liquidity Swept)`, 'success');");
code = code.replace("this.addAnalysisLog(`M1 Order Block = FOUND [${obData.obLow} - ${obData.obHigh}]`, 'success');", "this.addAnalysisLog(`M1 Order Block = FOUND / រកឃើញហើយ [${obData.obLow} - ${obData.obHigh}]`, 'success');");
code = code.replace("this.addAnalysisLog(`M1 FVG = FOUND [${obData.fvgLow} - ${obData.fvgHigh}]`, 'success');", "this.addAnalysisLog(`M1 FVG = FOUND / រកឃើញហើយ [${obData.fvgLow} - ${obData.fvgHigh}]`, 'success');");

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
