import React from 'react';
import { 
  Play, 
  XOctagon, 
  Loader2, 
  CheckCircle2, 
  Zap,
  Power,
  ShieldCheck,
  Ban,
  Radio,
  RefreshCw
} from 'lucide-react';
import { BotState } from '../types';
import { botApi } from '../services/api';

interface ActionControlsPanelProps {
  state: BotState;
  executingAction: string | null;
  actionResult: { action: string; status: 'success' | 'error' } | null;
  onAction: (action: 'start' | 'close_all') => void;
}

export function ActionControlsPanel({
  state,
  executingAction,
  actionResult,
  onAction,
}: ActionControlsPanelProps) {
  // Determine true started state (persisted desired state or active status)
  const isStarted = (state.desiredBotState === 'RUNNING' || state.status === 'running' || Boolean(state.isStartRequested) || Boolean(state.startConfirmation?.isStartRequested));
  
  // Connection state from MT5 / Bridge
  const isMt5Connected = Boolean(state?.account?.isConnected && state?.account?.serverConnected);
  const connectionHealth = state.startConfirmation?.connectionState || (isMt5Connected ? 'HEALTHY' : 'DISCONNECTED');
  
  // Distinguish between healthy running vs started-but-temporarily-disconnected
  const isConnectionLost深入 = isStarted && (!isMt5Connected || connectionHealth === 'DISCONNECTED');
  const isFeedStale = isStarted && isMt5Connected && connectionHealth === 'BLOCKED_FEED';
  const isRunningHealthy = isStarted && !isConnectionLost深入 && !isFeedStale;

  const hasOpenTrades = (state.openTrades && state.openTrades.length > 0) || !!state.currentTrade;
  const isStartConfirmed = Boolean(state.startConfirmation?.eaRunning || (isStarted && state.startConfirmedTime));

  return (
    <div id="action-controls-panel" className="mt-8 bg-slate-900/95 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-2xl transition-all">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-indigo-500/20 to-blue-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider">
                ផ្ទាំងបញ្ជាប្រតិបត្តិការ (BOT CONTROL CENTER)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                2-CONTROL ONLY: START BOT + CLOSE ALL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              បញ្ជាដំណើរការ Scalping Bot និងបិទបញ្ចប់ Trade របស់ Bot ដោយសុវត្ថិភាពខ្ពស់
            </p>
          </div>
        </div>

        {/* Live Bot State Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
          <span className="text-[10px] uppercase text-slate-500 font-bold">BOT STATUS:</span>
          {isRunningHealthy ? (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              🟢 EA RUNNING (ACTIVE)
            </span>
          ) : isConnectionLost深入 ? (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-rose-400 animate-spin" />
              🔴 BOT STARTED (RECONNECTING...)
            </span>
          ) : isFeedStale ? (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              🟡 MARKET QUIET (WAITING)
            </span>
          ) : (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              ⚪ BOT IDLE (STANDBY / READY TO START)
            </span>
          )}
        </div>
      </div>

      {/* Live Trading Execution Mode Banner & Switch */}
      <div className="mb-5 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
            state.riskConfig?.liveTradingEnabled 
              ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.9)]' 
              : 'bg-slate-600'
          }`}></div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                ការជួញដូរលុយពិត (LIVE TRADING EXECUTION) :
              </span>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                state.riskConfig?.liveTradingEnabled
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}>
                {state.riskConfig?.liveTradingEnabled ? '🔴 ACTIVE (បើកជួញដូរលុយពិត)' : '⚪ OFF / SAFE (ត្រឹមតែវិភាគ)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {state.riskConfig?.liveTradingEnabled
                ? '⚠️ ប្រយ័ត្ន៖ Bot នឹងបាញ់ Real Order ទៅកាន់គណនី Exness ពិតពេលមាន ICT Setup M1 ពេញលេញ។'
                : '🛡️ សុវត្ថិភាពខ្ពស់៖ Bot កំពុងស្ថិតក្នុងទម្រង់វិភាគ (Monitor Only) មិនបាញ់ Real Order ទៅ Exness ទេ លុះត្រាតែអ្នកចុចបើក (ENABLE)។'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            if (state.riskConfig?.liveTradingEnabled) {
              if (confirm('តើអ្នកពិតជាចង់បិទ LIVE TRADING មែនទេ? (Turn OFF Live Trading?)')) {
                await botApi.updateRiskConfig({ liveTradingEnabled: false });
                window.dispatchEvent(new Event('refresh_state'));
              }
            } else {
              if (confirm('⚠️ គ្រោះថ្នាក់ (DANGER):\n\nតើអ្នកពិតជាចង់បើកដំណើរការ LIVE TRADING មែនទេ?\n\nBot នឹងចាប់ផ្តើមបាញ់ Order ដោយស្វ័យប្រវត្តិដោយប្រើប្រាស់លុយពិតរបស់អ្នក។ សូមពិនិត្យ Lot Size ឲ្យបានច្បាស់លាស់។')) {
                await botApi.updateRiskConfig({ liveTradingEnabled: true });
                window.dispatchEvent(new Event('refresh_state'));
              }
            }
          }}
          className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer ${
            state.riskConfig?.liveTradingEnabled
              ? 'bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-red-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 hover:border-amber-400'
          }`}
        >
          {state.riskConfig?.liveTradingEnabled ? '⏹️ ចុចបិទ (TURN OFF LIVE)' : '▶️ ចុចបើក (ENABLE LIVE TRADING)'}
        </button>
      </div>

      {/* 2 Action Command Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. START BOT BUTTON (EXACT STATE FLOW) */}
        {(() => {
          if (isRunningHealthy) {
            // STATE 2: STARTED + HEALTHY RUNNING
            return (
              <div
                className="relative flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40 cursor-default"
              >
                {/* Top Status & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30 transition-all">
                    <Zap size={24} className="fill-current" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      🟢 EA RUNNING = YES
                    </span>
                  </div>
                </div>

                {/* Label & Details */}
                <div>
                  <div className="font-black text-base md:text-lg text-emerald-300 tracking-wide flex items-center gap-2 transition-colors">
                    <span>🟢 BOT RUNNING (កំពុងដំណើរការ)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <div className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <Zap size={14} />
                    <span>DaRa M1 EA ACTIVE & SCANNING M1</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    Bot កំពុងដំណើរការវិភាគ M1 ស្វ័យប្រវត្តិ (M1 ONLY) — EA Running: YES | Real MT5 Connected
                  </p>
                </div>

                {/* Key Checklist Badges */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-medium text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> START CONFIRMED
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> EA RUNNING
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> MT5 CONNECTED
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> MARKET FEED LIVE
                  </span>
                </div>
              </div>
            );
          }

          if (isConnectionLost深入) {
            // STATE 3: STARTED + CONNECTION LOST / RECONNECTING
            return (
              <div
                id="btn-action-stop-lost"
                className="relative flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40 cursor-default"
              >
                {/* Top Status & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20 border border-amber-500/40 text-amber-400 transition-all shadow-sm">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      🟠 START STATE = ACTIVE
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-full border bg-rose-950/80 text-rose-300 border-rose-500/30">
                      🛑 NEW ENTRIES BLOCKED
                    </span>
                  </div>
                </div>

                {/* Label & Details */}
                <div>
                  <div className="font-black text-base md:text-lg text-amber-300 tracking-wide flex items-center gap-2">
                    <span>🟢 BOT STARTED</span>
                  </div>
                  <div className="text-xs text-amber-400 font-bold mt-1 flex items-center gap-1">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>🟠 CONNECTION LOST — RECONNECTING...</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    Bot ត្រូវបាន Start រួចហើយ — កំពុង Auto-Reconnect ទៅកាន់ MT5 / Bridge... រក្សា START STATE = ACTIVE (មិនចាំបាច់ចុច START ម្តងទៀតទេ វានឹង Auto-Resume ពេល Connection មកវិញ)
                  </p>
                </div>

                {/* Key Checklist Badges */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-medium text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Radio size={11} /> START STATE = ACTIVE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <Ban size={11} /> NEW ENTRIES BLOCKED
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> AUTO-RESUME ON CONNECT
                  </span>
                </div>
              </div>
            );
          }

          if (isFeedStale) {
            // STATE 4: STARTED + MARKET QUIET
            return (
              <div
                id="btn-action-start"
                className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 overflow-hidden bg-gradient-to-b from-yellow-950/40 via-slate-950 to-slate-950 border-yellow-500/60 shadow-[0_0_25px_rgba(234,179,8,0.2)] ring-1 ring-yellow-500/40 cursor-default"
              >
                {/* Top Status & Icon */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 transition-all shadow-sm">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                      🟡 START STATE = ACTIVE
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-full border bg-rose-950/80 text-rose-300 border-rose-500/30">
                      🛑 NEW ENTRIES BLOCKED
                    </span>
                  </div>
                </div>

                {/* Label & Details */}
                <div>
                  <div className="font-black text-base md:text-lg text-yellow-300 tracking-wide flex items-center gap-2">
                    <span>🟢 BOT STARTED</span>
                  </div>
                  <div className="text-xs text-yellow-400 font-bold mt-1 flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" />
                    <span>⏳ MARKET QUIET — WAITING FOR TICKS</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    Bot ត្រូវបាន Start រួចហើយ — ទីផ្សារកំពុងស្ងាត់ (Market Quiet) ឬ Feed ដើរយឺត... រក្សា START STATE = ACTIVE និងបន្តវិភាគដោយស្វ័យប្រវត្តិពេលមានទិន្នន័យថ្មី។
                  </p>
                </div>

                {/* Key Checklist Badges */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-medium text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                    <Radio size={11} /> START STATE = ACTIVE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <Ban size={11} /> NEW ENTRIES BLOCKED
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <CheckCircle2 size={11} /> AUTO-RESUME ON CONNECT
                  </span>
                </div>
              </div>
            );
          }


          // STATE 1: NOT STARTED / STOPPED BY USER
          return (
            <button
              id="btn-action-start"
              type="button"
              onClick={() => onAction('start')}
              disabled={executingAction !== null}
              className="relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden bg-slate-950/80 hover:bg-slate-900 border-slate-800/90 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] disabled:cursor-not-allowed"
            >
              {/* Top Status & Icon */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950">
                  {executingAction === 'start' ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Play size={24} className="fill-current ml-0.5" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border bg-slate-900 text-slate-400 border-slate-800">
                    ⚪ READY TO START
                  </span>
                </div>
              </div>

              {/* Label & Details */}
              <div>
                <div className="font-black text-base md:text-lg text-white group-hover:text-emerald-300 tracking-wide flex items-center gap-2">
                  <span>▶ START BOT</span>
                </div>
                <div className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
                  <Zap size={14} />
                  <span>(START DaRa M1 EA & CONTINUOUS M1 ANALYSIS)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  ចាប់ផ្តើមដំណើរការ DaRa M1 EA ពេញលេញ ស្វែងរក Liquidity Sweep លើ M1 និងអនុញ្ញាតឱ្យបើក Real Trade ពេលមាន Setup ពេញលេញ
                </p>
              </div>

              {/* Key Checklist Badges */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-medium text-slate-300">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={11} /> EA READY
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <CheckCircle2 size={11} /> M1 ONLY
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <CheckCircle2 size={11} /> REAL EXECUTION
                </span>
              </div>

              {/* Execution Feedback */}
              {executingAction === 'start' && (
                <div className="mt-3 pt-2 border-t border-emerald-500/30 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  <span>កំពុងចាប់ផ្តើម Real EA...</span>
                </div>
              )}
              {actionResult?.action === 'start' && (
                <div className={`mt-3 pt-2 border-t text-xs font-bold flex items-center gap-1.5 ${
                  actionResult.status === 'success' ? 'text-emerald-400 border-emerald-500/30' : 'text-rose-400 border-rose-500/30'
                }`}>
                  {actionResult.status === 'success' ? <CheckCircle2 size={14} /> : <XOctagon size={14} />}
                  <span>{actionResult.status === 'success' ? 'START CONFIRMED = YES (EA RUNNING)' : 'START FAILED (បរាជ័យ)'}</span>
                </div>
              )}
            </button>
          );
        })()}
        
        {/* 2. CLOSE ALL TRADES BUTTON */}
        <button
          id="btn-action-close-all"
          type="button"
          onClick={() => onAction('close_all')}
          disabled={executingAction !== null}
          className={`relative group flex flex-col justify-between p-5 md:p-6 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
            hasOpenTrades
              ? 'bg-gradient-to-b from-rose-950/40 via-slate-950 to-slate-950 border-rose-500/60 hover:border-rose-500 hover:shadow-[0_0_25px_rgba(225,29,72,0.25)] ring-1 ring-rose-500/40'
              : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800/90 hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]'
          } disabled:cursor-not-allowed`}
        >
          {/* Top Status & Icon */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
              {executingAction === 'close_all' ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <XOctagon size={24} />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border bg-rose-950/60 text-rose-300 border-rose-500/40 flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" />
                MAGIC 778899 ONLY
              </span>
            </div>
          </div>

          {/* Label & Details */}
          <div>
            <div className="font-black text-base md:text-lg text-rose-300 group-hover:text-rose-200 tracking-wide flex items-center gap-1.5">
              <span>CLOSE ALL TRADES</span>
            </div>
            <div className="text-xs text-rose-400 font-bold mt-1 flex items-center gap-1">
              <Ban size={14} />
              <span>(CLOSE BOT POSITIONS & BLOCK NEW ENTRIES)</span>
            </div>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              បិទ Position របស់ Bot (Magic 778899) ទាំងអស់ភ្លាមៗលើ MT5 និងបញ្ឈប់ការបើក Trade ថ្មី (មិនប៉ះពាល់ Manual Trades របស់ User ឡើយ)
            </p>
          </div>

          {/* Key Checklist Badges */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-medium text-slate-300">
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
              <Ban size={11} /> BLOCK NEW ENTRIES
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck size={11} /> MANUAL TRADES SAFE
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <CheckCircle2 size={11} /> MT5 CONFIRMED
            </span>
          </div>

          {/* Execution Feedback */}
          {executingAction === 'close_all' && (
            <div className="mt-3 pt-2 border-t border-rose-500/30 text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" />
              <span>កំពុងបញ្ជូនបញ្ជា Close ទៅកាន់ MT5...</span>
            </div>
          )}
          {actionResult?.action === 'close_all' && (
            <div className={`mt-3 pt-2 border-t text-xs font-bold flex items-center gap-1.5 ${
              actionResult.status === 'success' ? 'text-emerald-400 border-emerald-500/30' : 'text-rose-400 border-rose-500/30'
            }`}>
              {actionResult.status === 'success' ? <CheckCircle2 size={14} /> : <XOctagon size={14} />}
              <span>{actionResult.status === 'success' ? '🔴 ALL TRADES CLOSED' : 'CLOSE ALL FAILED'}</span>
            </div>
          )}
        </button>

      </div>
    </div>
  );
}
