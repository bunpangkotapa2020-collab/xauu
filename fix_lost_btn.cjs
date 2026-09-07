const fs = require('fs');
let code = fs.readFileSync('src/components/ActionControlsPanel.tsx', 'utf8');

const broken = `              <button id="btn-action-stop-lost" onClick={() => onAction('stop')}
                id="btn-action-start"
                className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40 cursor-default"
              >`;

const fixed = `              <button
                id="btn-action-stop-lost"
                onClick={() => onAction('stop')}
                className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.25)] ring-1 ring-amber-500/40 cursor-pointer"
              >`;

code = code.replace(broken, fixed);

fs.writeFileSync('src/components/ActionControlsPanel.tsx', code);
console.log('fixed broken tags');
