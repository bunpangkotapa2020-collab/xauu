const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf-8');

const logicTarget = `                // Try to find the exact level from engine state
                const levelState = state.signalDetails?.daraSetup?.entryLevels?.[slot - 1];
                let tradeInSlot = null;
                if (levelState && levelState.executed) {
                   tradeInSlot = (state.openTrades || []).find(t => String((t as any).ticket) === String(levelState.ticket) || String(t.id) === String(levelState.ticket));
                } else {
                   // Fallback to purely index-based mapping if not properly linked
                   tradeInSlot = state.openTrades?.[slot - 1];
                }
                
                const isAnalyzingSlot = state.status === 'running' && openCount === slot - 1;
                const isFilled = !!tradeInSlot;
                const targetPrice = levelState?.targetPrice;`;

const newLogic = `                const setup = state.signalDetails?.daraSetup;
                const levelState = setup?.entryLevels?.[slot - 1];
                let tradeInSlot = null;
                if (levelState && levelState.executed) {
                   tradeInSlot = (state.openTrades || []).find(t => String((t as any).ticket) === String(levelState.ticket) || String(t.id) === String(levelState.ticket));
                } else {
                   tradeInSlot = state.openTrades?.[slot - 1];
                }
                
                const targetPrice = levelState?.targetPrice;
                const daraState = state.signalDetails?.daraState || '';
                
                // Detailed State Machine Logic
                let cardStatus = 'WAIT';
                let isActiveStyle = false;
                let isFilled = false;
                
                if (!setup) {
                   cardStatus = 'WAIT FOR NEXT SETUP';
                } else if (levelState) {
                   if (levelState.executed) {
                       if (tradeInSlot) {
                           isFilled = true;
                           isActiveStyle = true;
                           const isTrailed = setup.sharedSL && tradeInSlot.sl && (tradeInSlot.side === 'BUY' ? tradeInSlot.sl > setup.sharedSL : tradeInSlot.sl < setup.sharedSL);
                           if (isTrailed || daraState === 'TRAILING') {
                               cardStatus = 'PROFIT TRAILING';
                           } else {
                               cardStatus = 'TRADE ACTIVE';
                           }
                       } else {
                           cardStatus = 'TRADE CLOSED';
                       }
                   } else {
                       let nextPendingLevel = 0;
                       for (let i = 0; i < 5; i++) {
                           if (setup.entryLevels && !setup.entryLevels[i]?.executed) {
                               nextPendingLevel = i;
                               break;
                           }
                       }
                       if (slot - 1 === nextPendingLevel) {
                           isActiveStyle = true;
                           if (daraState === 'EXECUTING') {
                               cardStatus = 'BROKER CONFIRMATION';
                           } else if (daraState === 'ENTRY_REACHED' || setup.status === 'ENTRY_REACHED') {
                               cardStatus = 'ENTRY REACHED';
                           } else if (daraState === 'WAIT_FOR_LOCKED_ENTRY' || setup.lockedEntryPrice) {
                               cardStatus = 'LOCKED ENTRY / TARGET REACHED';
                           } else {
                               cardStatus = 'WAIT';
                           }
                       } else {
                           cardStatus = 'WAIT';
                       }
                   }
                }
                
                // Keep UI backwards compatible
                const isAnalyzingSlot = isActiveStyle && !isFilled;`;

code = code.replace(logicTarget, newLogic);

const uiTarget = `                      ) : isAnalyzingSlot ? (
                        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-center gap-2 text-amber-400 text-xs font-bold font-mono w-full">
                          <Loader2 size={13} className="animate-spin text-amber-400" />
                          <span>កំពុងរង់ចាំ (SCANNING)</span>
                        </div>
                      ) : (
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 text-center text-slate-500 font-medium font-mono text-[11px] flex items-center justify-center gap-1.5 w-full">
                          <Clock size={12} />
                          <span>STANDBY (មិនទាន់ដល់)</span>
                        </div>
                      )}`;

const newUi = `                      ) : isAnalyzingSlot ? (
                        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-center gap-2 text-amber-400 text-[10px] sm:text-xs font-bold font-mono w-full text-center">
                          <Loader2 size={13} className="animate-spin text-amber-400 shrink-0" />
                          <span className="truncate">{cardStatus}</span>
                        </div>
                      ) : (
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 text-center text-slate-500 font-medium font-mono text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 w-full">
                          {cardStatus === 'TRADE CLOSED' ? <CheckCircle2 size={12} className="text-emerald-500/70" /> : <Clock size={12} />}
                          <span className="truncate">{cardStatus}</span>
                        </div>
                      )}`;
                      
code = code.replace(uiTarget, newUi);

const stageTarget = `<div className="text-xs font-semibold text-slate-300 mb-2.5">
                      {stage}
                      {targetPrice && !isFilled && <span className="ml-2 font-mono text-slate-400">@{targetPrice.toFixed(3)}</span>}
                    </div>`;
                    
const newStage = `<div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
                      <div>
                        {stage}
                        {targetPrice && !isFilled && <span className="ml-2 font-mono text-slate-400">@{targetPrice.toFixed(3)}</span>}
                      </div>
                      {(isFilled || cardStatus === 'TRADE CLOSED') && <span className="font-mono text-cyan-400 text-[9px] uppercase tracking-wider">{cardStatus}</span>}
                    </div>`;

code = code.replace(stageTarget, newStage);

fs.writeFileSync('src/components/MainDashboard.tsx', code);
console.log("Patched MainDashboard.tsx");
