const fs = require('fs');
const content = fs.readFileSync('src/components/ActionControlsPanel.tsx', 'utf8');

const oldBlock = `          if (isConnectionLost深入) {
            // STATE 3: STARTED + CONNECTION LOST / RECONNECTING
            return (
              <div
                id="btn-action-start"
                className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40 cursor-default"
              >
                {/* Top Status & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20 border border-amber-500/40 text-amber-400 transition-all shadow-sm">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      🟠 START STATE = ACTIVE
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-full border bg-rose-950/80 text-rose-300 border-rose-500/30">
                      🛑 NEW ENTRIES BLOCKED
                    </span>
                  </div>
                </div>

                {/* Label & Details */}
                <div>
                  <div className="font-black text-base md:text-lg text-amber-300 tracking-wide flex items-center gap-2">
                    <span>🟢 BOT STARTED</span>
                  </div>
                  <div className="text-xs text-amber-400 font-bold mt-1 flex items-center gap-1">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>🟠 CONNECTION LOST — RECONNECTING...</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    Bot ត្រូវបាន Start រួចហើយ — កំពុង Auto-Reconnect ទៅកាន់ MT5 / Bridge... រក្សា START STATE = ACTIVE (មិនចាំបាច់ចុច START ម្តងទៀតទេ វានឹង Auto-Resume ពេល Connection មកវិញ)
                  </p>
                </div>

                {/* Key Checklist Badges */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-medium text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Radio size={11} /> START STATE = ACTIVE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <Ban size={11} /> NEW ENTRIES BLOCKED
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> AUTO-RESUME ON CONNECT
                  </span>
                </div>
              </div>
            );
          }`;

const newBlock = oldBlock + `

          if (isFeedStale) {
            // STATE 4: STARTED + MARKET QUIET
            return (
              <div
                id="btn-action-start"
                className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-yellow-950/40 via-slate-950 to-slate-950 border-yellow-500/60 shadow-[0_0_25px_rgba(234,179,8,0.2)] ring-1 ring-yellow-500/40 cursor-default"
              >
                {/* Top Status & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 transition-all shadow-sm">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                      🟡 START STATE = ACTIVE
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-full border bg-rose-950/80 text-rose-300 border-rose-500/30">
                      🛑 NEW ENTRIES BLOCKED
                    </span>
                  </div>
                </div>

                {/* Label & Details */}
                <div>
                  <div className="font-black text-base md:text-lg text-yellow-300 tracking-wide flex items-center gap-2">
                    <span>🟢 BOT STARTED</span>
                  </div>
                  <div className="text-xs text-yellow-400 font-bold mt-1 flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" />
                    <span>⏳ MARKET QUIET — WAITING FOR TICKS</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    Bot ត្រូវបាន Start រួចហើយ — ទីផ្សារកំពុងស្ងាត់ (Market Quiet) ឬ Feed ដើរយឺត... រក្សា START STATE = ACTIVE និងបន្តវិភាគដោយស្វ័យប្រវត្តិពេលមានទិន្នន័យថ្មី។
                  </p>
                </div>

                {/* Key Checklist Badges */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-medium text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                    <Radio size={11} /> START STATE = ACTIVE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <Ban size={11} /> NEW ENTRIES BLOCKED
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> AUTO-RESUME ON CONNECT
                  </span>
                </div>
              </div>
            );
          }
`;

fs.writeFileSync('src/components/ActionControlsPanel.tsx', content.replace(oldBlock, newBlock));
