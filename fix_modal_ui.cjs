const fs = require('fs');

let panel = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

// 1. We remove the "LOT SIZING MODE" block completely
const lotModeRegex = /\{\/\* Lot Mode Toggle \*\/\}.*?\{\/\* Mode Selection Cards \*\/\}/s;
panel = panel.replace(lotModeRegex, "{/* Lot Mode Toggle Removed */} \n {/* Mode Selection Cards */}");

// 2. The Mode Selection Cards currently has "Auto Risk Section" and "Auto Lot Size Section".
// The user wants ONE block: An editable Lot Size.
const modeCardsRegex = /<div className="grid grid-cols-1 sm:grid-cols-2 gap-3\.5">.*?\{\/\* Entries Per Signal \*\/\}/s;

const newLotBlock = `<div className="grid grid-cols-1 gap-3.5">
                <div className="p-3 bg-amber-500/[0.05] border border-amber-500/50 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black tracking-widest rounded-bl-lg z-10 shadow-sm">MANUAL</div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-400 uppercase flex items-center gap-1">
                      <span>LOT SIZE (FIXED)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-lot-size"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="10.0"
                      value={lotSize}
                      onChange={(e) => {
                          setLotSize(e.target.value);
                          setLotSizeMode('fixed');
                      }}
                      className="flex-1 bg-slate-900 border border-amber-500/30 rounded-lg py-2 px-3 text-amber-500 font-mono text-center font-bold text-sm shadow-[inset_0_0_10px_rgba(245,158,11,0.05)] focus:outline-none focus:border-amber-400"
                      placeholder="0.01"
                    />
                  </div>
                  <div className="text-[10px] text-amber-300/70 text-center leading-tight">
                    ទំហំ Lot Size ពិតប្រាកដដែលនឹងប្រើប្រាស់ដោយ NEW ICT EA
                  </div>
                </div>
              </div>

              {/* Entries Per Signal */}`;

panel = panel.replace(modeCardsRegex, newLotBlock);


// 3. The TP & SL block should display the active values exactly like we did before.
const tpslRegex = /\{\/\* TP & SL Pips \*\/\}.*?\{\/\* TAB 2: RISK LIMITS \*\/\}/s;

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
            </div>
          )}

          {/* TAB 2: RISK LIMITS */}`;

panel = panel.replace(tpslRegex, newTpSlBlock);

fs.writeFileSync('src/components/BotSettingsModal.tsx', panel);
