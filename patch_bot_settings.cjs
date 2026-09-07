const fs = require('fs');

const newContent = `import React from 'react';
import { X, Settings, Shield, Clock, Server, CheckCircle2, Activity, Play, Check, Square } from 'lucide-react';
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
              <p className="text-xs text-slate-400">គ្រប់គ្រងដោយស្វ័យប្រវត្តិ (Auto-Managed by Backend)</p>
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
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="text-blue-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-blue-200/90 leading-relaxed">
              <strong>Fully Automatic EA:</strong> ប្រព័ន្ធនេះត្រូវបានរៀបចំឲ្យដើរដោយស្វ័យប្រវត្តិទាំងស្រុង។ 
              អ្នកមិនចាំបាច់កំណត់ (Manual Setup) សម្រាប់ Trade នីមួយៗឡើយ។ គ្រាន់តែចុច <strong>START</strong> 
              រួច EA នឹងទាញយកក្បួនខ្នាតនិងការកំណត់ទាំងនេះទៅប្រើដោយស្វ័យប្រវត្តិ។
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
                  <span className="text-slate-500">Version/Build</span>
                  <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">v2.1.0-ICT</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Live Trading</span>
                  {botState.status === 'running' ? (
                     <span className="text-emerald-400 font-bold flex items-center gap-1.5"><Play size={12}/> ENABLED</span>
                  ) : (
                     <span className="text-rose-400 font-bold flex items-center gap-1.5"><Square size={12} className="fill-current"/> DISABLED</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Execution Mode</span>
                  <span className="text-blue-400 font-bold">META_API (REAL)</span>
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
                    <span className="text-rose-400 font-bold">${"$"}{liveConfig.dailyLossLimit || 50}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Max Consecutive SL</span>
                    <span className="text-white font-bold">{liveConfig.maxConsecutiveSL || 3} Trades</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Trading Session</span>
                    <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">
                       {liveConfig.tradingSessionStart || '08:00'} - {liveConfig.tradingSessionEnd || '22:00'}
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
}`;

fs.writeFileSync('src/components/BotSettingsModal.tsx', newContent);
console.log("Patched BotSettingsModal.tsx");
