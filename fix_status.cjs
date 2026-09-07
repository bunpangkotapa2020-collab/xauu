const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// Replace the hardcoded status logic with a dynamic one that simulates these statuses
const oldStatus = `<div className={"flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border " + (isRunning ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : isPaused ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400')}>
                 <div className={"w-2 h-2 rounded-full " + (isRunning ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-red-500')}></div>
                 {isRunning ? 'កំពុងដំណើរការ' : isPaused ? 'បានផ្អាក' : 'បានបញ្ឈប់'}
              </div>`;

const newStatus = `
              {/* Dynamic Status Render */}
              {(() => {
                let statusColor = "bg-slate-500/10 border-slate-500/20 text-slate-400";
                let dotColor = "bg-slate-500";
                let statusText = "⚪ TRADING SESSION CLOSED";
                
                if (!isConnected) {
                  statusColor = "bg-red-500/10 border-red-500/20 text-red-400";
                  dotColor = "bg-red-500";
                  statusText = "🔴 MT5 CONNECTION ERROR";
                } else if (state.status === 'running') {
                  statusColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                  dotColor = "bg-emerald-500";
                  statusText = "🟢 BOT RUNNING";
                } else if (state.status === 'paused') {
                  statusColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                  dotColor = "bg-amber-500";
                  statusText = "🟡 TRADING PAUSED";
                } else if (state.status === 'stopped') {
                  statusColor = "bg-red-500/10 border-red-500/20 text-red-400";
                  dotColor = "bg-red-500";
                  statusText = "🔴 BOT STOPPED";
                } else if (state.status === 'daily_limit_hit') {
                  statusColor = "bg-red-500/10 border-red-500/20 text-red-400";
                  dotColor = "bg-red-500";
                  statusText = "🔴 DAILY LOSS LIMIT";
                }

                return (
                  <div className={"flex items-center gap-2 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border " + statusColor}>
                    <div className={"w-2 h-2 rounded-full " + dotColor}></div>
                    {statusText}
                  </div>
                );
              })()}
`;

code = code.replace(oldStatus, newStatus);
fs.writeFileSync('src/components/MainDashboard.tsx', code);
