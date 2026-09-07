const fs = require('fs');
let content = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

const s1 = '{/* Fixed Lot Size Section */}';
const e1 = '{/* Entries Per Signal */}';
if (content.includes(s1) && content.includes(e1)) {
  content = content.substring(0, content.indexOf(s1)) + 
`{/* Auto Risk Section */}
                <div className="p-3 bg-amber-500/[0.05] border border-amber-500/50 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black tracking-widest rounded-bl-lg z-10 shadow-sm">AUTO (SAFE)</div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-400 uppercase flex items-center gap-1">
                      <span>RISK PERCENT</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 bg-slate-900 border border-amber-500/30 rounded-lg py-2 px-3 text-amber-500 font-mono text-center font-bold text-sm select-none shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]">
                      1.0% / Trade
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-300/70 text-center leading-tight">
                    សុវត្ថិភាពខ្ពស់ មិនបារម្ភរឿងខាតច្រើន
                  </div>
                </div>

                {/* Auto Lot Size Section */}
                <div className="p-3 bg-amber-500/[0.05] border border-amber-500/50 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black tracking-widest rounded-bl-lg z-10 shadow-sm">DYNAMIC</div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-400 uppercase flex items-center gap-1">
                      <span>LOT SIZE</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 bg-slate-900 border border-amber-500/30 rounded-lg py-2 px-3 text-amber-500 font-mono text-center font-bold text-sm select-none shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]">
                      AUTO CALCULATED
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-300/70 text-center leading-tight">
                    គណនាតាម Risk 1% & ចម្ងាយ SMC SL
                  </div>
                </div>
              </div>

              ` + content.substring(content.indexOf(e1));
} else { console.log('e1 missing'); }

const s2 = '{/* Entries Per Signal */}';
const e2 = '{/* TP & SL Pips */}';
if (content.includes(s2) && content.includes(e2)) {
  content = content.substring(0, content.indexOf(s2)) + 
`{/* Entries Per Signal */}
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black tracking-widest rounded-bl-lg z-10 shadow-sm">AUTO (SMC)</div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 uppercase">ENTRIES ក្នុងមួយ SIGNAL (POSITIONS)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 bg-slate-900 border border-slate-700/50 rounded-lg py-2 px-3 text-amber-500 font-mono text-center font-bold text-sm select-none shadow-[inset_0_0_10px_rgba(245,158,11,0.05)] opacity-80 cursor-not-allowed">
                    AUTO (1 Entry / SMC Setup)
                  </div>
                </div>
              </div>
              
              ` + content.substring(content.indexOf(e2));
}

const s3 = '{/* TP & SL Pips */}';
const e3 = '{/* Max Open Trades */}';
if (content.includes(s3) && content.includes(e3)) {
  content = content.substring(0, content.indexOf(s3)) + 
`{/* TP & SL Pips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Take Profit (TP) */}
                <div className="p-3.5 bg-emerald-950/10 border border-emerald-500/20 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-black tracking-widest rounded-bl-lg z-10 shadow-sm">AUTO RR</div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400 uppercase">TAKE PROFIT (TP)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 bg-slate-950 border border-emerald-500/20 rounded-lg py-2 px-3 text-emerald-400 font-mono text-center font-bold text-sm select-none shadow-[inset_0_0_10px_rgba(16,185,129,0.05)] cursor-not-allowed">
                      AUTO (Target RR 1:2.4)
                    </div>
                  </div>
                </div>

                {/* Stop Loss (SL) */}
                <div className="p-3.5 bg-rose-950/10 border border-rose-500/20 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black tracking-widest rounded-bl-lg z-10 shadow-sm">AUTO SMC</div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-rose-400 uppercase">STOP LOSS (SL)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 bg-slate-950 border border-rose-500/20 rounded-lg py-2 px-3 text-rose-400 font-mono text-center font-bold text-sm select-none shadow-[inset_0_0_10px_rgba(244,63,94,0.05)] cursor-not-allowed">
                      AUTO (M1 Order Block)
                    </div>
                  </div>
                </div>
              </div>

              ` + content.substring(content.indexOf(e3));
}

const s4 = '{/* Max Open Trades */}';
const e4 = '{/* Drawdown & Consistency Protections */}';
if (content.includes(s4) && content.includes(e4)) {
  content = content.substring(0, content.indexOf(s4)) + 
`{/* Max Open Trades */}
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black tracking-widest rounded-bl-lg z-10 shadow-sm">AUTO (LIMIT)</div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 uppercase">ចំនួន POSITIONS បើកអតិបរមាក្នុងពេលតែមួយ (MAX OPEN TRADES)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 bg-slate-900 border border-slate-700/50 rounded-lg py-2 px-3 text-amber-500/80 font-mono text-center font-bold text-sm select-none shadow-[inset_0_0_10px_rgba(245,158,11,0.05)] cursor-not-allowed">
                    AUTO (Max 1 Trade ក្នុងមួយ Setup)
                  </div>
                </div>
              </div>

              ` + content.substring(content.indexOf(e4));
}

fs.writeFileSync('src/components/BotSettingsModal.tsx', content, 'utf8');
console.log('Replacements done!');
