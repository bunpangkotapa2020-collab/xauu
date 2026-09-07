const fs = require('fs');
let code = fs.readFileSync('src/components/ProtectionSettingsPanel.tsx', 'utf-8');

const target = `            {/* Column 2: Trading Sessions & Environment Shield */}
            <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-4 shadow-inner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    <span>ម៉ោងជួញដូរស្វ័យប្រវត្តិ (TRADING SESSION)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> LIVE
                  </span>
                </div>
                
                <div className="space-y-3.5 mt-3.5">
                  {/* Start & End Time Side-by-Side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 mb-1.5">
                        <Clock size={13} className="text-emerald-400" />
                        <span>Start Time</span>
                      </div>
                      <input 
                        id="input-start-hour"
                        type="time" 
                        value={startHour} 
                        onChange={e => {
                          setIsDirty(true);
                          setStartHour(e.target.value);
                        }} 
                        className="bg-slate-950 border border-slate-700/80 text-white rounded-lg px-2.5 py-1.5 text-xs w-full text-center font-mono font-bold focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 mb-1.5">
                        <Clock size={13} className="text-rose-400" />
                        <span>End Time</span>
                      </div>
                      <input 
                        id="input-stop-hour"
                        type="time" 
                        value={stopHour} 
                        onChange={e => {
                          setIsDirty(true);
                          setStopHour(e.target.value);
                        }} 
                        className="bg-slate-950 border border-slate-700/80 text-white rounded-lg px-2.5 py-1.5 text-xs w-full text-center font-mono font-bold focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>`;

const replacement = `            {/* Column 2: Trading Sessions & Environment Shield */}
            <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-4 shadow-inner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    <span>ម៉ោងជួញដូរស្វ័យប្រវត្តិ (TRADING SESSION)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> 🟢 24/7 AUTO
                  </span>
                </div>
                
                <div className="space-y-3.5 mt-3.5">
                  {/* 24/7 Auto Banner */}
                  <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-300">24/7 CONTINUOUS OPERATION</div>
                        <div className="text-[11px] text-slate-400">មិនបាច់កំណត់ម៉ោងជួញដូរ — EA វិភាគនិង Trade 24/7 ពេលទីផ្សារបើក</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                      {botState?.isMarketOpen !== false ? '🟢 MARKET OPEN' : '⏸️ MARKET CLOSED'}
                    </span>
                  </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/ProtectionSettingsPanel.tsx', code);
  console.log('Successfully updated ProtectionSettingsPanel.tsx for 24/7 AUTO');
} else {
  console.error('Target not found in ProtectionSettingsPanel.tsx');
}
