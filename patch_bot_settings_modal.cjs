const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Clock, Server, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import { BotState } from '../types';
import { botApi } from '../services/api';

interface BotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  botState: BotState;
  onSaveSuccess?: () => void;
}

export function BotSettingsModal({
  isOpen,
  onClose,
  botState,
  onSaveSuccess
}: BotSettingsModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // Form states
  const [lotSize, setLotSize] = useState('0.01');
  const [slDist, setSlDist] = useState('10');
  const [tpDist, setTpDist] = useState('20');
  const [dailyLoss, setDailyLoss] = useState('2000');
  const [maxTrades, setMaxTrades] = useState('4');
  const [maxConsSL, setMaxConsSL] = useState('3');
  const [cooldown, setCooldown] = useState('15');

  // Load initial from botState
  useEffect(() => {
    if (isOpen && botState?.riskConfig) {
      if (botState.riskConfig.lotSize !== undefined) setLotSize(String(botState.riskConfig.lotSize));
      if (botState.riskConfig.stopLossPips !== undefined) setSlDist(String(botState.riskConfig.stopLossPips));
      if (botState.riskConfig.takeProfitPips !== undefined) setTpDist(String(botState.riskConfig.takeProfitPips));
      if (botState.riskConfig.maxDailyLossAmount !== undefined) setDailyLoss(String(botState.riskConfig.maxDailyLossAmount));
      if (botState.riskConfig.maxOpenTrades !== undefined) setMaxTrades(String(botState.riskConfig.maxOpenTrades));
      if (botState.riskConfig.maxConsecutiveLosses !== undefined) setMaxConsSL(String(botState.riskConfig.maxConsecutiveLosses));
      if (botState.riskConfig.cooldownMinutes !== undefined) setCooldown(String(botState.riskConfig.cooldownMinutes));
      setSuccessMsg(false);
      setErrorMsg('');
    }
  }, [isOpen, botState]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg(false);

    try {
      await botApi.updateRiskConfig({
        lotSize: Number(lotSize),
        stopLossPips: Number(slDist),
        takeProfitPips: Number(tpDist),
        maxDailyLossAmount: Number(dailyLoss),
        maxOpenTrades: Number(maxTrades),
        maxConsecutiveLosses: Number(maxConsSL),
        cooldownMinutes: Number(cooldown),
      });
      setSuccessMsg(true);
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

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
              <h2 className="text-lg font-bold text-white">USER TRADING SETTINGS</h2>
              <p className="text-xs text-slate-400">អ្នកជាអ្នកកំណត់ការគ្រប់គ្រងទាំងស្រុង (Single Source of Truth)</p>
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
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <Shield className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-amber-200/90 leading-relaxed">
              <strong>User Controlled Configuration:</strong> រាល់តម្លៃដែលអ្នកបញ្ចូលទីនេះ នឹងត្រូវបាន Save និងប្រើប្រាស់ដោយផ្ទាល់ពី EA ។ EA នឹងមិនមានការ Override ដោយ Backend ឡើយ។
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* LOT SIZE */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Lot Size</label>
              <input 
                type="number" step="0.01" min="0.01"
                value={lotSize} onChange={(e) => setLotSize(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* MAX OPEN TRADES */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Max Open Trades</label>
              <input 
                type="number" step="1" min="1"
                value={maxTrades} onChange={(e) => setMaxTrades(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* SL DISTANCE */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Stop Loss (Distance / Points)</label>
              <input 
                type="number" step="0.1" min="1"
                value={slDist} onChange={(e) => setSlDist(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* TP DISTANCE */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Take Profit (Distance / Points)</label>
              <input 
                type="number" step="0.1" min="1"
                value={tpDist} onChange={(e) => setTpDist(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* DAILY LOSS LIMIT */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Daily Loss Limit (USC)</label>
              <input 
                type="number" step="10" min="0"
                value={dailyLoss} onChange={(e) => setDailyLoss(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* MAX CONSECUTIVE SL */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Max Consecutive SL (Trades)</label>
              <input 
                type="number" step="1" min="1"
                value={maxConsSL} onChange={(e) => setMaxConsSL(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* COOLDOWN */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Cooldown After SL (Minutes)</label>
              <input 
                type="number" step="1" min="0"
                value={cooldown} onChange={(e) => setCooldown(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={14} /> Settings Saved Successfully!
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
console.log('Done!');
