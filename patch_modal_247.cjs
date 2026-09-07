const fs = require('fs');

const content = `import React from 'react';
import { X, Settings, Shield, Clock, Server, CheckCircle2, Activity, Play, Check, Square, Radio } from 'lucide-react';
import { BotState } from '../types';

interface BotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  botState: BotState;
}

export function BotSettingsModal({
  isOpen,
  onClose,
  botState
}: BotSettingsModalProps) {
  if (!isOpen) return null;

  const liveConfig = (botState as any).liveEaConfig || {};
  const isMarketOpen = botState.isMarketOpen !== false;
  const isRunning = botState.status === 'running';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/60 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Settings size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">LIVE EA CONFIGURATION</h2>
              <p className="text-xs text-slate-400">គ្រប់គ្រងដោយស្វ័យប្រវត្តិ 24/7 (Auto-Managed by Backend)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-emerald-200/90 leading-relaxed">
              <strong>Fully Automatic 24/7 EA:</strong> ប្រព័ន្ធដំណើរការដោយស្វ័យប្រវត្តិតាមទីផ្សារ 24/7 ដោយគ្មានការកំណត់ម៉ោងជួញដូរដោយដៃឡើយ។ គ្រាន់តែចុច <strong>START</strong> រួច EA នឹងវិភាគនិងបើក Trade ស្វ័យប្រវត្តិតាមក្បួន ICT។ នៅពេលទីផ្សារបិទ EA នឹងរង់ចាំដោយស្វ័យប្រវត្តិ ហើយបន្តដំណើរការឡើងវិញភ្លាមៗពេលទីផ្សារបើក។
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Engine Info */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-slate-300 border-b border-slate-800 pb-2">
                <Server size={16} className="text-emerald-400" />
                <h3 className="font-semibold text-sm">EA Engine Details</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">EA Status</span>
                  {isRunning ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      🟢 EA RUNNING
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1.5 font-mono text-xs bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      🔴 ALL TRADES CLOSED
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Live Trading</span>
                  {liveConfig.LIVE_TRADING_ENABLED ? (
                     <span className="text-emerald-400 font-bold flex items-center gap-1.5"><Play size={12}/> ENABLED</span>
                  ) : (
                     <span className="text-rose-400 font-bold flex items-center gap-1.5">
                       <Square size={12} className="fill-current"/> 
                       {isRunning && !isMarketOpen ? '⏸️ WAITING FOR MARKET OPEN' : 'DISABLED'}
                     </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Market Status</span>
                  {isMarketOpen ? (
                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                      <Radio size={12} className="text-emerald-400 animate-pulse" />
                      🟢 MARKET OPEN / EA ACTIVE
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                      ⏸️ WAITING FOR MARKET OPEN
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Execution Mode</span>
                  <span className="text-blue-400 font-bold">META_API (REAL USC)</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Symbol</span>
                  <span className="text-white font-bold">{liveConfig.symbol || 'XAUUSD'}</span>
                </div>
              </div>
            </div>

            {/* Risk & Order Info */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-slate-300 border-b border-slate-800 pb-2">
                <Shield size={16} className="text-blue-400" />
                <h3 className="font-semibold text-sm">Risk & Orders</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Fixed Lot Size</span>
                  <span className="text-white font-bold">{liveConfig.lotSize || 0.01} Lot</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Max Open Trades</span>
                  <span className="text-white font-bold">{liveConfig.maxOpenTrades || 4}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">RR Requirement</span>
                  <span className="text-white font-bold">1 : {liveConfig.minRR || 1.5} Min</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Dynamic SL/TP</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5"><Check size={14}/> ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Protection Info */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-slate-300 border-b border-slate-800 pb-2">
                <Activity size={16} className="text-rose-400" />
                <h3 className="font-semibold text-sm">Protections & Limits</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Daily Loss Limit</span>
                    <span className="text-rose-400 font-bold">\${liveConfig.dailyLossLimit || 50}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Max Consecutive SL</span>
                    <span className="text-white font-bold">{liveConfig.maxConsecutiveSL || 3} Trades</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Trading Session</span>
                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      🟢 24/7 AUTO
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Cooldown (Post-Loss)</span>
                    <span className="text-white font-bold">{liveConfig.cooldownMinutes || 15} Mins</span>
                  </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/BotSettingsModal.tsx', content, 'utf-8');
console.log('Saved src/components/BotSettingsModal.tsx with 24/7 spec');
