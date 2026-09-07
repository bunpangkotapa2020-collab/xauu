const fs = require('fs');

let panel = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

const tpslRegex = /\{\/\* TP & SL Pips \*\/\}.*?\{\/\* Max Open Trades \*\/\}/s;

const newTpSlBlock = `{/* TP & SL Pips */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                 <div className="flex items-center justify-between mb-3">
                   <h4 className="text-[11px] text-slate-300 font-bold tracking-widest uppercase">DYNAMIC ICT TARGETS</h4>
                   <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">AUTO CALC</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                       <span className="text-[10px] text-slate-500 block mb-0.5">SIDE</span>
                       <span className={\`font-mono font-bold \${activeSide === 'BUY' ? 'text-emerald-400' : activeSide === 'SELL' ? 'text-rose-400' : 'text-slate-400'}\`}>{activeSide || 'WAITING'}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                       <span className="text-[10px] text-slate-500 block mb-0.5">ENTRY</span>
                       <span className="font-mono text-white font-bold">{activeEntry ? activeEntry.toFixed(2) : '---'}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                       <span className="text-[10px] text-slate-500 block mb-0.5">SL</span>
                       <span className="font-mono text-rose-400 font-bold">{activeSL ? activeSL.toFixed(2) : '---'}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                       <span className="text-[10px] text-slate-500 block mb-0.5">TP</span>
                       <span className="font-mono text-emerald-400 font-bold">{activeTP ? activeTP.toFixed(2) : '---'}</span>
                    </div>
                 </div>
                 <div className="mt-2 bg-slate-900/50 p-2 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-500 text-[10px]">R:R (Risk:Reward)</span>
                    <span className="font-mono text-amber-400 font-bold text-xs">{activeRR ? activeRR.toFixed(2) : '---'}</span>
                 </div>
              </div>

              {/* Max Open Trades */}`;

panel = panel.replace(tpslRegex, newTpSlBlock);

fs.writeFileSync('src/components/BotSettingsModal.tsx', panel);
