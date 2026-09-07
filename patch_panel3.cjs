const fs = require('fs');
let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

// Replace everything related to slPips/tpPips and risk_percent mode
const riskPercentBlock = `<div className="flex gap-2 p-1 bg-slate-900 border border-slate-700 rounded-lg w-full max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => setLotSizeMode('fixed')}
                    className={\`flex-1 py-1.5 px-3 text-[10px] font-bold rounded-md transition-all \${
                      lotSizeMode === 'fixed' 
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }\`}
                  >
                    FIXED LOT
                  </button>
                  <button
                    type="button"
                    onClick={() => setLotSizeMode('risk_percent')}
                    className={\`flex-1 py-1.5 px-3 text-[10px] font-bold rounded-md transition-all \${
                      lotSizeMode === 'risk_percent' 
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }\`}
                  >
                    RISK %
                  </button>
                </div>`;
code = code.replace(riskPercentBlock, `<div className="flex gap-2 p-1 bg-slate-900 border border-slate-700 rounded-lg w-full max-w-[240px]">
                  <button
                    type="button"
                    className="flex-1 py-1.5 px-3 text-[10px] font-bold rounded-md transition-all bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  >
                    FIXED EXACT LOT
                  </button>
                </div>`);

const calcBlockRegex = /  const parsedLotSize = parseFloat\(lotSize\).*?calculatedRiskAmount = effectiveLotSize \* parsedSlPips \* 10;/gs;
code = code.replace(calcBlockRegex, `  const parsedLotSize = parseFloat(lotSize) || 0.01;
  const parsedEntries = parseInt(entriesPerSignal) || 1;
  const parsedMaxOpen = parseInt(maxOpenTrades) || 4;
  let effectiveLotSize = parsedLotSize;
  const totalLots = effectiveLotSize * parsedEntries;
  const maxPortfolioLots = totalLots * parsedMaxOpen;`);

code = code.replace(/<span className="font-mono text-red-400 font-bold">\s*~\{calculatedRiskAmount.toFixed\(2\)\} \{currency\}\s*<\/span>/, 
    '<span className="font-mono text-slate-400 font-bold">Dynamic ICT Risk</span>');

code = code.replace(/\{lotSizeMode === 'fixed' \? 'Fixed Exact Lot' : `\$\{parsedRiskPercent\}% Risk \/ Trade`\}/, "'Fixed Exact Lot'");

code = code.replace(/stopLossPips: parsedSlPips,/, "");

const helpRegex = /<div className="text-xs text-slate-400 leading-relaxed space-y-2 mt-2">.*?<\/div>/s;
code = code.replace(helpRegex, `<div className="text-[11px] text-slate-400 leading-relaxed mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                  <span className="font-bold text-amber-400">⚡ Fixed Exact Lot Mode:</span> The EA will strictly use your defined Lot Size for every entry, regardless of SL size. Dynamic SL and TP are managed entirely by the ICT engine based on market structure.
                </div>`);

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
