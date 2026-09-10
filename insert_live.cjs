const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

const liveTradingBlock = `
          {/* LIVE TRADING CONTROL */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
              <Shield size={64} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className={\`w-3 h-3 rounded-full \${liveTradingEnabled ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-slate-600'}\`}></div>
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">LIVE TRADING / ការជួញដូរលុយពិត <span className={\`px-2 py-0.5 rounded text-[10px] \${liveTradingEnabled ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"}\`}>{liveTradingEnabled ? "ON" : "OFF"}</span></h3>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 relative z-10">
                {liveTradingEnabled 
                  ? '⚠️ គ្រោះថ្នាក់ (DANGER): Bot នឹងបាញ់ Order ទៅកាន់ទីផ្សារពិត (REAL MONEY EXECUTION ACTIVE)។' 
                  : 'សុវត្ថិភាព (SAFE): Bot ត្រឹមតែវិភាគ មិនបាញ់ Order លុយពិតទេ។'}
              </p>
            </div>
            
            <button
              type="button"
              onClick={async () => {
                if (liveTradingEnabled) {
                  setLiveTradingEnabled(false);
                  try {
                    await botApi.updateRiskConfig({ liveTradingEnabled: false });
                    if (onSaveSuccess) onSaveSuccess();
                  } catch(e){}
                } else {
                  if (botState?.status !== 'running') {
                    alert("⚠️ បដិសេធ (DENIED): សូមចុចប៊ូតុង START ដំណើរការ Bot ជាមុនសិន។\\n\\nPlease START the Engine first.");
                    return;
                  }
                  if (!botState?.account?.serverConnected) {
                    alert("⚠️ បដិសេធ (DENIED): មិនទាន់ភ្ជាប់គណនី MT5 ទេ។\\n\\nMT5 Server is not connected.");
                    return;
                  }
                  setShowLiveConfirm(true);
                }
              }}
              className={\`relative z-10 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-lg \${
                liveTradingEnabled 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                  : 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 hover:from-red-500 hover:to-red-600 hover:text-white border border-red-500/50'
              }\`}
            >
              {liveTradingEnabled ? 'TURN OFF LIVE' : 'ENABLE LIVE TRADING'}
            </button>
          </div>
          
          {showLiveConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-red-500 rounded-2xl max-w-sm w-full p-6 shadow-2xl shadow-red-500/20">
                <div className="flex items-center gap-3 text-red-500 mb-4">
                  <Shield size={28} />
                  <h3 className="text-lg font-black uppercase tracking-wide">Danger Zone</h3>
                </div>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  តើអ្នកពិតជាចង់បើកដំណើរការ <strong className="text-red-400">LIVE TRADING</strong> មែនទេ?
                  <br/><br/>
                  Bot នឹងចាប់ផ្តើមបាញ់ Order ដោយស្វ័យប្រវត្តិដោយប្រើប្រាស់លុយពិតរបស់អ្នក។ សូមពិនិត្យ Lot Size ឲ្យបានច្បាស់លាស់។
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLiveConfirm(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700"
                  >
                    បោះបង់ (CANCEL)
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setShowLiveConfirm(false);
                      setLiveTradingEnabled(true);
                      try {
                        await botApi.updateRiskConfig({ liveTradingEnabled: true });
                        if (onSaveSuccess) onSaveSuccess();
                      } catch(e){}
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20"
                  >
                    យល់ព្រម (CONFIRM LIVE)
                  </button>
                </div>
              </div>
            </div>
          )}
`;

// Insert it right after {/* Content */}
const target = '<div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">';
if (code.includes(target) && !code.includes("LIVE TRADING CONTROL")) {
  code = code.replace(target, target + liveTradingBlock);
  fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
  console.log("Inserted LIVE TRADING CONTROL");
} else {
  console.log("Could not find insertion point or already inserted.");
}
