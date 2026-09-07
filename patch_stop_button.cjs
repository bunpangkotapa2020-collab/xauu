const fs = require('fs');
let code = fs.readFileSync('src/components/ActionControlsPanel.tsx', 'utf8');

const oldStartHealthy = `            // STATE 2: STARTED + HEALTHY RUNNING
            return (
              <div
                id="btn-action-start"
                className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40 cursor-default"
              >
                {/* Top Status & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30 transition-all">
                    <Zap size={24} className="fill-current" />
                  </div>`;

const newStartHealthy = `            // STATE 2: STARTED + HEALTHY RUNNING
            return (
              <button
                id="btn-action-stop"
                onClick={() => onAction('stop')}
                className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.25)] ring-1 ring-emerald-500/40 cursor-pointer"
              >
                {/* Top Status & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-400 group-hover:bg-rose-500 text-slate-950 shadow-md shadow-emerald-500/30 group-hover:shadow-rose-500/30 transition-all">
                    {executingAction === 'stop' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} className="fill-current" />}
                  </div>`;

code = code.replace(oldStartHealthy, newStartHealthy);

const oldStartHealthyEnd = `                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> MARKET FEED LIVE
                  </span>
                </div>
              </div>
            );`;

const newStartHealthyEnd = `                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> MARKET FEED LIVE
                  </span>
                </div>
              </button>
            );`;

code = code.replace(oldStartHealthyEnd, newStartHealthyEnd);

// Do the same for isConnectionLost深入 block
const oldLost = `          if (isConnectionLost深入) {
            // STATE 3: STARTED BUT CONNECTION LOST (Waiting to Auto-Resume)
            return (
              <div
                id="btn-action-start"
                className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40 cursor-default"
              >
                {/* Top Status & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 transition-all">
                    <Radio size={24} className="fill-current animate-pulse" />
                  </div>`;

const newLost = `          if (isConnectionLost深入) {
            // STATE 3: STARTED BUT CONNECTION LOST (Waiting to Auto-Resume)
            return (
              <button
                id="btn-action-stop-lost"
                onClick={() => onAction('stop')}
                className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.25)] ring-1 ring-amber-500/40 cursor-pointer"
              >
                {/* Top Status & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500 group-hover:bg-rose-500 text-slate-950 shadow-md shadow-amber-500/30 transition-all">
                    {executingAction === 'stop' ? <Loader2 size={24} className="animate-spin" /> : <Radio size={24} className="fill-current animate-pulse" />}
                  </div>`;

code = code.replace(oldLost, newLost);

const oldLostEnd = `                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> AUTO-RESUME ON CONNECT
                  </span>
                </div>
              </div>
            );`;

const newLostEnd = `                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> AUTO-RESUME ON CONNECT
                  </span>
                </div>
              </button>
            );`;

code = code.replace(oldLostEnd, newLostEnd);

fs.writeFileSync('src/components/ActionControlsPanel.tsx', code);
console.log('patched stop button');
