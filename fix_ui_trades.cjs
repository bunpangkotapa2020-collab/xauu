const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const oldTrades = `        {/* CURRENT TRADE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6">
           <h2 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-amber-400"/> TRADE កំពុងដំណើរការ (CURRENT TRADE)
           </h2>
           {!state.currentTrade ? (
              <div className="py-10 bg-slate-950/50 border border-slate-800/50 rounded-xl flex flex-col items-center justify-center text-center">
                 <div className="text-slate-300 font-bold mb-1 text-sm md:text-base">មិនមាន Trade កំពុងដំណើរការ</div>
                 <div className="text-slate-500 text-[11px] md:text-xs">ចុច «START» ដើម្បីឱ្យ Bot ចាប់ផ្តើមវិភាគ និងបើក Trade</div>
              </div>
           ) : (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                 <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center gap-3">
                     <span className={"px-3 py-1 rounded font-bold text-[11px] md:text-sm " + (state.currentTrade.side === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400')}>
                       {state.currentTrade.side} {state.currentTrade.symbol}
                     </span>
                     <span className="text-slate-400 font-mono text-[11px] md:text-sm">{state.currentTrade.lot} Lot</span>
                   </div>
                   <div className={"font-mono font-bold text-base md:text-lg " + (state.currentTrade.floatingProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                     {state.currentTrade.floatingProfit >= 0 ? '+' : ''}{state.currentTrade.floatingProfit.toFixed(2)} {state.account.currency}
                   </div>
                 </div>
                 <div className="flex flex-wrap gap-4 md:gap-6 text-[11px] md:text-sm text-slate-400 pt-3 border-t border-slate-800/80">
                   <div>Open: <span className="text-white font-mono">{state.currentTrade.entryPrice}</span></div>
                   <div>Current: <span className="text-amber-400 font-mono">{state.currentTrade.currentPrice}</span></div>
                   <div>SL: <span className="text-red-400 font-mono">{state.currentTrade.sl}</span></div>
                   <div>TP: <span className="text-emerald-400 font-mono">{state.currentTrade.tp}</span></div>
                 </div>
              </div>
           )}
        </div>`;

const newTrades = `        {/* CURRENT TRADE & SIGNALS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
             <h2 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-400"/> TRADE កំពុងដំណើរការ (OPEN BOT TRADES: {state.openTrades?.length || 0})
             </h2>
             {state.signalDetails && (
               <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  NEW SIGNAL: {state.signalDetails.side === 'BUY' ? '🟢 BUY' : '🔴 SELL'} {state.signalDetails.symbol}
               </div>
             )}
           </div>
           
           {!state.openTrades || state.openTrades.length === 0 ? (
              <div className="py-10 bg-slate-950/50 border border-slate-800/50 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                 {state.signalDetails && (
                    <div className="absolute inset-0 bg-indigo-500/5 flex flex-col items-center justify-center p-4">
                       <div className="text-indigo-300 font-bold mb-2">SIGNAL DETECTED</div>
                       <div className="flex gap-4 text-xs font-mono text-slate-300">
                          <span>Entry: {state.signalDetails.entry.toFixed(2)}</span>
                          <span>Lot: {state.signalDetails.lot}</span>
                          <span className="text-red-400">SL: {state.signalDetails.sl.toFixed(2)}</span>
                          <span className="text-emerald-400">TP: {state.signalDetails.tp.toFixed(2)}</span>
                       </div>
                    </div>
                 )}
                 <div className={"transition-opacity " + (state.signalDetails ? 'opacity-10' : 'opacity-100')}>
                    <div className="text-slate-300 font-bold mb-1 text-sm md:text-base">មិនមាន Trade កំពុងដំណើរការ</div>
                    <div className="text-slate-500 text-[11px] md:text-xs">ចុច «START» ដើម្បីឱ្យ Bot ចាប់ផ្តើមវិភាគ និងបើក Trade</div>
                 </div>
              </div>
           ) : (
              <div className="space-y-3">
                 {state.openTrades.map((trade, idx) => (
                    <div key={trade.id || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                       <div className="flex justify-between items-center mb-3">
                         <div className="flex items-center gap-3">
                           <span className={"px-3 py-1 rounded font-bold text-[11px] md:text-sm " + (trade.side === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400')}>
                             {trade.side} {trade.symbol}
                           </span>
                           <span className="text-slate-400 font-mono text-[11px] md:text-sm">{trade.lot} Lot</span>
                         </div>
                         <div className={"font-mono font-bold text-base md:text-lg " + (trade.floatingProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                           {trade.floatingProfit >= 0 ? '+' : ''}{trade.floatingProfit.toFixed(2)} {state.account.currency}
                         </div>
                       </div>
                       <div className="flex flex-wrap gap-4 md:gap-6 text-[11px] md:text-sm text-slate-400 pt-3 border-t border-slate-800/80">
                         <div>Open: <span className="text-white font-mono">{trade.entryPrice}</span></div>
                         <div>Current: <span className="text-amber-400 font-mono">{trade.currentPrice}</span></div>
                         <div>SL: <span className="text-red-400 font-mono">{trade.sl}</span></div>
                         <div>TP: <span className="text-emerald-400 font-mono">{trade.tp}</span></div>
                       </div>
                    </div>
                 ))}
                 
                 {state.openTrades.length > 1 && (
                    <div className="p-3 bg-slate-900 border border-slate-700/50 rounded-lg flex justify-between items-center">
                       <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">TOTAL COMBINED PROFIT:</span>
                       <span className={"font-mono font-bold text-sm " + (state.openTrades.reduce((s, t) => s + t.floatingProfit, 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {state.openTrades.reduce((s, t) => s + t.floatingProfit, 0) >= 0 ? '+' : ''}{state.openTrades.reduce((s, t) => s + t.floatingProfit, 0).toFixed(2)} {state.account.currency}
                       </span>
                    </div>
                 )}
              </div>
           )}
        </div>`;

code = code.replace(oldTrades, newTrades);
fs.writeFileSync('src/components/MainDashboard.tsx', code);
