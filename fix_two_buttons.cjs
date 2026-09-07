const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// 1. Fix the "Real Account" button
const realAccountDivConnected = `<div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  គណនីពិត - បានភ្ជាប់
               </div>`;
const realAccountBtnConnected = `<button onClick={() => setShowConnectModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold shrink-0 transition-colors cursor-pointer focus:outline-none">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  គណនីពិត - បានភ្ជាប់
               </button>`;
code = code.replace(realAccountDivConnected, realAccountBtnConnected);

const realAccountDivDisconnected = `<div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400 text-xs font-semibold shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                  មិនទាន់ភ្ជាប់គណនី
               </div>`;
const realAccountBtnDisconnected = `<button onClick={() => setShowConnectModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-400 text-xs font-semibold shrink-0 transition-colors cursor-pointer focus:outline-none">
                  <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                  មិនទាន់ភ្ជាប់គណនី
               </button>`;
code = code.replace(realAccountDivDisconnected, realAccountBtnDisconnected);

// 2. Fix the "Edit Settings" button
const editSettingsBtn = `<button onClick={handleComingSoon} className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors font-medium">
               <Settings size={14} /> កែប្រែ Settings
             </button>`;
const newEditSettingsBtn = `<button onClick={() => { window.dispatchEvent(new CustomEvent('open_settings')); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors font-medium cursor-pointer focus:outline-none">
               <Settings size={14} /> កែប្រែ Settings
             </button>`;
code = code.replace(editSettingsBtn, newEditSettingsBtn);

fs.writeFileSync('src/components/MainDashboard.tsx', code);
