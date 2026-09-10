const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const startIdx = code.indexOf('{/* 4-Entry Sequence Pipeline Visualizer */}');
const endIdx = code.indexOf('{/* Active Trades Table or Modern Empty State */}');

if (startIdx !== -1 && endIdx !== -1) {
    const original = code.substring(startIdx, endIdx);
    
    const replacement = `          {/* DaRa 5-LEVEL ENTRY PIPELINE */}
          <div className="mb-5 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-white tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-amber-400 shrink-0" />
                  DaRa 5-LEVEL ENTRY PIPELINE
                </span>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-amber-300">
                  {state.riskConfig?.lotSize || 0.01} LOT / ENTRY
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {state.status === 'running' ? (
                  state.openTrades?.length === 5 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-2 text-xs font-mono bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      គ្រប់ 5 Entries — កំពុងតាមដាន TP / SL
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-2 text-xs font-mono bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg">
                      <Loader2 size={13} className="animate-spin text-amber-400" />
                      កំពុងស្កេនរក Entry #{(state.openTrades?.length || 0) + 1}/5
                    </span>
                  )
                ) : (
                  <span className="text-slate-400 font-medium flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-rose-500/80"></span>
                    BOT STOPPED (STANDBY)
                  </span>
                )}
              </div>
            </div>

            {/* 5-Step Pipeline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { slot: 1, label: 'Entry #1', stage: 'Trend Confirm' },
                { slot: 2, label: 'Entry #2', stage: 'Pullback Entry' },
                { slot: 3, label: 'Entry #3', stage: 'Breakout Push' },
                { slot: 4, label: 'Entry #4', stage: 'Full Momentum' },
                { slot: 5, label: 'Entry #5', stage: 'Max Extension' },
              ].map(({ slot, label, stage }) => {
                const openCount = state.openTrades?.length || 0;
                
                // Try to find the exact level from engine state
                const levelState = state.signalDetails?.daraSetup?.entryLevels?.[slot - 1];
                let tradeInSlot = null;
                if (levelState && levelState.executed) {
                   tradeInSlot = (state.openTrades || []).find(t => String(t.ticket) === String(levelState.ticket) || String(t.id) === String(levelState.ticket));
                } else {
                   // Fallback to purely index-based mapping if not properly linked
                   tradeInSlot = state.openTrades?.[slot - 1];
                }
                
                const isAnalyzingSlot = state.status === 'running' && openCount === slot - 1;
                const isFilled = !!tradeInSlot;
                const targetPrice = levelState?.targetPrice;

                return (
                  <div
                    key={slot}
                    className={\`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[120px] \${
                      isFilled
                        ? 'bg-gradient-to-b from-emerald-950/35 via-slate-900 to-slate-950 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                        : isAnalyzingSlot
                        ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)] ring-1 ring-amber-500/30'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80'
                    }\`}
                  >
                    {/* Top card header */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={\`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black font-mono shadow-sm \${
                          isFilled
                            ? 'bg-emerald-500 text-slate-950'
                            : isAnalyzingSlot
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }\`}>
                          {slot}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">{label}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800/90 text-amber-300 border border-slate-700/60">
                        {state.riskConfig?.lotSize || 0.01} Lot
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-300 mb-2.5">
                      {stage}
                      {targetPrice && !isFilled && <span className="ml-2 font-mono text-slate-400">@{targetPrice.toFixed(3)}</span>}
                    </div>

                    {/* Content status & Functional Control */}
                    <div className="mt-auto pt-2 border-t border-slate-800/50">
                      {isFilled && tradeInSlot ? (
                        <div className="flex flex-col gap-2">
                            <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-2.5 flex justify-between items-center shadow-inner">
                            <div className="flex items-center gap-1.5">
                                {tradeInSlot.side === 'BUY' ? (
                                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-0.5">
                                    <ArrowUpRight size={13} /> BUY
                                </span>
                                ) : (
                                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
                                    <ArrowDownRight size={13} /> SELL
                                </span>
                                )}
                                <span className="text-xs font-mono text-slate-300 ml-1">@{tradeInSlot.entryPrice}</span>
                            </div>
                            <span className={\`font-mono text-xs sm:text-sm font-black \${(tradeInSlot.floatingProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                                {(tradeInSlot.floatingProfit ?? 0) >= 0 ? '+' : ''}{(tradeInSlot.floatingProfit ?? 0).toFixed(2)}
                            </span>
                            </div>
                            <button 
                                onClick={() => window.confirm(\`បិទ Position នេះមែនទេ? (Ticket: \${tradeInSlot.id})\`) && botApi.executeAction('close_single', { tradeId: tradeInSlot.id })}
                                className="w-full py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Lock size={12} />
                                ចុចបិទទីផ្សារនេះ (CLOSE)
                            </button>
                        </div>
                      ) : isAnalyzingSlot ? (
                        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-center gap-2 text-amber-400 text-xs font-bold font-mono w-full">
                          <Loader2 size={13} className="animate-spin text-amber-400" />
                          <span>កំពុងរង់ចាំ (SCANNING)</span>
                        </div>
                      ) : (
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 text-center text-slate-500 font-medium font-mono text-[11px] flex items-center justify-center gap-1.5 w-full">
                          <Clock size={12} />
                          <span>STANDBY (មិនទាន់ដល់)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          `;
    code = code.replace(original, replacement);
    fs.writeFileSync('src/components/MainDashboard.tsx', code);
    console.log("Successfully replaced the pipeline.");
} else {
    console.log("Could not find start/end markers.");
}
