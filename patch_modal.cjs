const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf-8');

const target = `                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Live Trading</span>
                  {botState.status === 'running' ? (
                     <span className="text-emerald-400 font-bold flex items-center gap-1.5"><Play size={12}/> ENABLED</span>
                  ) : (
                     <span className="text-rose-400 font-bold flex items-center gap-1.5"><Square size={12} className="fill-current"/> DISABLED</span>
                  )}
                </div>`;

const replacement = `                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Live Trading</span>
                  {liveConfig.LIVE_TRADING_ENABLED ? (
                     <span className="text-emerald-400 font-bold flex items-center gap-1.5"><Play size={12}/> ENABLED</span>
                  ) : (
                     <span className="text-rose-400 font-bold flex items-center gap-1.5"><Square size={12} className="fill-current"/> DISABLED</span>
                  )}
                </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
console.log('Patched BotSettingsModal.tsx');
