const fs = require('fs');
let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');
const searchStr = `                <input 
                  id="input-entries-per-signal"
                  type="number" 
                  min="1"
                  max="4"
                  value={entriesPerSignal} 
                  onChange={(e) => setEntriesPerSignal(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-20 text-right font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>`;
const replacement = searchStr + `

              {/* Additional Entry Distance */}
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-xs font-semibold">Additional Entry (Raw Price)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Distance for Scale-in (e.g. 4.0)</div>
                </div>
                <input 
                  id="input-additional-entry"
                  type="number" 
                  step="0.1"
                  min="0.1"
                  max="50.0"
                  value={additionalEntryDistance} 
                  onChange={(e) => setAdditionalEntryDistance(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-20 text-right font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>`;
code = code.replace(searchStr, replacement);
fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
console.log('UI Patched!');
