const fs = require('fs');
let content = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// I will remove the injected block, and then inject it outside the ternary.
const injectedCode = `                 {/* DYNAMIC MARKET ENGINE STATUS */}
                 <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-2 text-center transition-all hover:bg-slate-900 duration-300">
                      <div className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase tracking-widest">MARKET SPEED</div>
                      <div className={\`text-xs sm:text-sm font-bold uppercase \${state.marketSpeed === 'EXTREME' ? 'text-rose-400' : state.marketSpeed === 'FAST' ? 'text-amber-400' : 'text-emerald-400'}\`}>
                        {state.marketSpeed || 'NORMAL'}
                      </div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-2 text-center transition-all hover:bg-slate-900 duration-300">
                      <div className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase tracking-widest">VOLATILITY (RNG)</div>
                      <div className="text-xs sm:text-sm font-mono font-bold text-slate-200">
                        {state.volatilityValue ? state.volatilityValue.toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-2 text-center transition-all hover:bg-slate-900 duration-300">
                      <div className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase tracking-widest">SL / TP MODE</div>
                      <div className="text-xs sm:text-sm font-bold text-indigo-400">
                        AUTO DYNAMIC
                      </div>
                    </div>
                 </div>`;

content = content.replace(injectedCode, '');

// Now insert it AFTER the ternary ends, which is after: `)} \n </div>`
const targetPoint = `                    )}
                  </div>`;
content = content.replace(targetPoint, targetPoint + '\n' + injectedCode);

fs.writeFileSync('src/components/MainDashboard.tsx', content);
console.log('fixed dashboard syntax');
