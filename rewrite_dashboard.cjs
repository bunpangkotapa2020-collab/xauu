const fs = require('fs');

const code = `import React, { useState } from 'react';
import { Play, Pause, Square, XOctagon, LogOut, CheckCircle2, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { BotState } from '../types';
import { ConnectMT5Modal } from './ConnectMT5Modal';
import { botApi } from '../services/api';

interface MainDashboardProps {
  state: BotState;
  onLogout: () => void;
  onRefresh: () => void;
}

export function MainDashboard({ state, onLogout, onRefresh }: MainDashboardProps) {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAction = async (action: 'start' | 'pause' | 'stop' | 'close_all') => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await botApi.sendAction(action);
      if (!res.success) {
        setErrorMsg(res.error || 'មានបញ្ហាក្នុងការបញ្ជា Bot');
      } else {
        onRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const isConnected = state.account.isConnected;
  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  
  const risk = state.autoRiskProfile;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <SparklesIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">REAL TRADING BOT</h1>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <span className={\`w-2 h-2 rounded-full \${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}\`}></span>
                {isConnected ? \`ភ្ជាប់គណនី: \${state.account.loginId} (\${state.account.server})\` : 'មិនទាន់ភ្ជាប់គណនី'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isConnected ? (
              <button onClick={() => setShowConnectModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">
                ភ្ជាប់ REAL MT5
              </button>
            ) : (
              <button onClick={() => {
                 botApi.sendAction('disconnect_account').then(() => onRefresh());
              }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors">
                ផ្តាច់គណនី
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-6 pb-24 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="whitespace-pre-wrap">{errorMsg}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BALANCE & EQUITY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">គណនី (REAL ACCOUNT)</h2>
            <div className="flex justify-between items-end mb-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Balance</div>
                <div className="text-3xl font-bold text-white font-mono">
                  {state.account.balance > 0 ? \`\${state.account.balance.toLocaleString()} \${state.account.currency}\` : '0.00'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500 mb-1">Equity</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">
                  {state.account.equity > 0 ? \`\${state.account.equity.toLocaleString()} \${state.account.currency}\` : '0.00'}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
              <div className="text-sm text-slate-400">Today P/L</div>
              <div className={\`text-lg font-bold font-mono \${state.todayProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}\`}>
                {state.todayProfitLoss >= 0 ? '+' : ''}{state.todayProfitLoss.toFixed(2)} {state.account.currency}
              </div>
            </div>
          </div>

          {/* LIVE PRICES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
             <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">តម្លៃទីផ្សារបច្ចុប្បន្ន (LIVE)</h2>
             
             <div className="flex items-center justify-between bg-slate-950 rounded-xl p-3 border border-slate-800/50 mb-3">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold">X</div>
                 <div className="font-bold text-white">XAUUSD</div>
               </div>
               <div className="text-right font-mono">
                  <div className="text-xs text-slate-500">BID: <span className="text-red-400 text-sm ml-1">{state.bidPrice?.toFixed(2) || '0.00'}</span></div>
                  <div className="text-xs text-slate-500">ASK: <span className="text-blue-400 text-sm ml-1">{state.askPrice?.toFixed(2) || '0.00'}</span></div>
               </div>
             </div>

             <div className="flex items-center justify-between bg-slate-950 rounded-xl p-3 border border-slate-800/50">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">₿</div>
                 <div className="font-bold text-white">BTCUSD</div>
               </div>
               <div className="text-right font-mono">
                  <div className="text-xs text-slate-500">BID: <span className="text-red-400 text-sm ml-1">{state.btcBidPrice?.toFixed(2) || '0.00'}</span></div>
                  <div className="text-xs text-slate-500">ASK: <span className="text-blue-400 text-sm ml-1">{state.btcAskPrice?.toFixed(2) || '0.00'}</span></div>
               </div>
             </div>
          </div>
        </div>

        {/* RISK & MONEY MANAGEMENT - AUTO CALCULATED */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">កំណត់ Risk និង Money Management ស្វ័យប្រវត្តិ</h2>
          </div>
          
          {!isConnected || state.account.balance === 0 ? (
            <div className="text-center py-6 text-slate-500">
               សូមភ្ជាប់គណនី Real ដើម្បីឱ្យប្រព័ន្ធគណនាទំហំ Lot និង Risk ជូនលោកអ្នកដោយស្វ័យប្រវត្តិ។
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <RiskBox label="Risk ក្នុងមួយ Trade" value={\`\${risk?.riskPerTradePercent || 1}%\`} color="text-blue-400" />
                <RiskBox label="ខាតអតិបរមា / Trade" value={\`\${risk?.maxLossPerTrade || 0} \${state.account.currency}\`} color="text-red-400" />
                <RiskBox label="Maximum Daily Loss" value={\`\${risk?.maxDailyLoss || 0} \${state.account.currency}\`} color="text-orange-400" />
                <RiskBox label="Maximum Drawdown" value={\`\${risk?.maxDrawdownPercent || 10}%\`} color="text-purple-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                 <RiskMini label="Lot Size ណែនាំ" value={risk?.lotSize || 0} />
                 <RiskMini label="Lot ក្នុង 1 Entry" value={risk?.lotPerEntry || 0} />
                 <RiskMini label="Take Profit" value={\`\${risk?.tpPips || 60} Pips\`} />
                 <RiskMini label="Stop Loss" value={\`\${risk?.slPips || 30} Pips\`} />
                 <RiskMini label="Risk/Reward" value={risk?.riskRewardRatio || '1:2'} />
              </div>
            </>
          )}
        </div>

        {/* BOT CONTROLS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
           <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">គ្រប់គ្រង BOT (AUTO TRADING)</h2>
           
           <div className="flex flex-wrap gap-4">
             <button
               onClick={() => handleAction('start')}
               disabled={actionLoading || isRunning || !isConnected}
               className={\`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all \${isRunning ? 'bg-emerald-600/50 cursor-not-allowed ring-2 ring-emerald-500' : !isConnected ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]'}\`}
             >
               <Play className="w-5 h-5" /> START
             </button>
             
             <button
               onClick={() => handleAction('pause')}
               disabled={actionLoading || isPaused || !isRunning}
               className={\`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all \${isPaused ? 'bg-amber-600/50 text-white cursor-not-allowed ring-2 ring-amber-500' : !isRunning ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95 shadow-[0_0_15px_rgba(217,119,6,0.3)]'}\`}
             >
               <Pause className="w-5 h-5" /> PAUSE
             </button>

             <button
               onClick={() => handleAction('stop')}
               disabled={actionLoading || state.status === 'stopped'}
               className={\`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all \${state.status === 'stopped' ? 'bg-red-600/50 text-white cursor-not-allowed ring-2 ring-red-500' : 'bg-red-600 hover:bg-red-500 text-white active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.3)]'}\`}
             >
               <Square className="w-5 h-5" /> STOP
             </button>

             <button
               onClick={() => handleAction('close_all')}
               disabled={actionLoading || !state.currentTrade}
               className={\`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all \${!state.currentTrade ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95'}\`}
             >
               <XOctagon className="w-5 h-5" /> CLOSE BOT TRADES
             </button>
           </div>
        </div>

        {/* CURRENT TRADE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
           <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">ការជួញដូរបច្ចុប្បន្ន (CURRENT TRADE)</h2>
           
           {!state.currentTrade ? (
             <div className="text-center py-8 text-slate-500 bg-slate-950 rounded-xl border border-slate-800/50">
                មិនមាន Trade កំពុងបើកទេ
             </div>
           ) : (
             <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                   <div className="flex items-center gap-3">
                     <span className={\`px-3 py-1 rounded-md font-bold text-sm \${state.currentTrade.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}\`}>
                       {state.currentTrade.side}
                     </span>
                     <span className="font-bold text-white">{state.currentTrade.symbol}</span>
                     <span className="text-slate-400 text-sm">Lot: {state.currentTrade.lot}</span>
                   </div>
                   <div className={\`text-xl font-bold font-mono \${state.currentTrade.floatingProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}\`}>
                     {state.currentTrade.floatingProfit >= 0 ? '+' : ''}{state.currentTrade.floatingProfit.toFixed(2)} {state.account.currency}
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                   <div>
                     <div className="text-slate-500 mb-1">Entry Price</div>
                     <div className="font-mono text-white">{state.currentTrade.entryPrice}</div>
                   </div>
                   <div>
                     <div className="text-slate-500 mb-1">Stop Loss (SL)</div>
                     <div className="font-mono text-red-400">{state.currentTrade.sl}</div>
                   </div>
                   <div>
                     <div className="text-slate-500 mb-1">Take Profit (TP)</div>
                     <div className="font-mono text-emerald-400">{state.currentTrade.tp}</div>
                   </div>
                </div>
             </div>
           )}
        </div>

      </main>

      {showConnectModal && (
        <ConnectMT5Modal
          onClose={() => setShowConnectModal(false)}
          onSuccess={() => {
            setShowConnectModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function SparklesIcon(props: any) {
  return <Sparkles {...props} />;
}

function ShieldCheckIcon(props: any) {
  return <ShieldCheck {...props} />;
}

function RiskBox({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50 text-center">
      <div className="text-xs text-slate-500 mb-2">{label}</div>
      <div className={\`text-xl font-bold font-mono \${color}\`}>{value}</div>
    </div>
  );
}

function RiskMini({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-base font-bold text-white font-mono">{value}</div>
    </div>
  );
}
`

fs.writeFileSync('src/components/MainDashboard.tsx', code);
console.log('Dashboard rewritten to be simple and auto-calculating.');
