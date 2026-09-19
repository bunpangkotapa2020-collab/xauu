import React from 'react';
import { ShieldAlert, AlertTriangle, Loader2, X, Check, Power } from 'lucide-react';

interface LiveTradingConfirmModalProps {
  isOpen: boolean;
  action: 'ENABLE' | 'DISABLE';
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
  errorMessage: string | null;
  loginId?: string;
  lotSize?: number;
  engineRunning?: boolean;
  mt5Connected?: boolean;
  safetyPassed?: boolean;
  safetyBlockedReason?: string | null;
}

export const LiveTradingConfirmModal: React.FC<LiveTradingConfirmModalProps> = ({
  isOpen,
  action,
  isSubmitting,
  onConfirm,
  onClose,
  errorMessage,
  loginId,
  lotSize = 0.01,
  engineRunning = false,
  mt5Connected = false,
  safetyPassed = true,
  safetyBlockedReason = null,
}) => {
  if (!isOpen) return null;

  const isEnable = action === 'ENABLE';
  const hasPreconditionIssue = isEnable && (!engineRunning || !mt5Connected || !safetyPassed);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
        style={{
          boxShadow: isEnable ? '0 0 40px rgba(239, 68, 68, 0.25)' : '0 0 30px rgba(100, 116, 139, 0.2)'
        }}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isEnable ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
              {isEnable ? <ShieldAlert className="w-7 h-7" /> : <Power className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide">
                {isEnable ? '⚠️ បញ្ជាក់ការបើក LIVE TRADING' : 'បិទ LIVE TRADING (TURN OFF)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEnable ? 'REAL MONEY EXECUTION CONFIRMATION' : 'SWITCH BACK TO MONITOR-ONLY MODE'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Display */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-950/60 border border-red-500/60 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="whitespace-pre-line leading-relaxed font-semibold">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Content Body */}
        {isEnable ? (
          <div className="space-y-4 mb-6">
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-200 leading-relaxed font-medium">
              ⚠️ <strong>គ្រោះថ្នាក់ (HIGH RISK WARNING):</strong><br />
              នៅពេលបើកដំណើរការ LIVE TRADING ប្រព័ន្ធ DaRa M1 EA នឹងចាប់ផ្តើមបាញ់ <strong>Real Order ចូលទៅក្នុងគណនី Exness ផ្ទាល់</strong> ដោយស្វ័យប្រវត្តិតាមសញ្ញា ICT M1 Setup ពេញលេញ។
            </div>

            {/* Pre-flight System Safety Checklist */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center justify-between">
                <span>លក្ខខណ្ឌតម្រូវសុវត្ថិភាព (PRE-FLIGHT CHECKLIST)</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${hasPreconditionIssue ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {hasPreconditionIssue ? '⚠️ PENDING CHECKS' : '✅ ALL CHECKS PASS'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">1. DaRa Engine:</span>
                <span className={`font-mono font-bold text-xs flex items-center gap-1.5 ${engineRunning ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${engineRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  {engineRunning ? '🟢 RUNNING (ដំណើរការ)' : '🔴 STOPPED (សូមចុច START BOT)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">2. Exness MT5:</span>
                <span className={`font-mono font-bold text-xs flex items-center gap-1.5 ${mt5Connected ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${mt5Connected ? 'bg-emerald-400' : 'bg-red-500'}`} />
                  {mt5Connected ? `🟢 CONNECTED (${loginId || 'Real'})` : '🔴 DISCONNECTED (ដាច់ការតភ្ជាប់)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">3. Safety Guards:</span>
                <span className={`font-mono font-bold text-xs flex items-center gap-1.5 ${safetyPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${safetyPassed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {safetyPassed ? '🟢 PASS (គ្មានការរារាំង)' : `⚠️ BLOCKED (${safetyBlockedReason || 'រារាំង'})`}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">គណនី MT5 (Exness):</span>
                <span className="font-mono font-bold text-emerald-400">{loginId || 'Connected Real Cent'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">ទំហំ Lot ជួញដូរ (Lot Size):</span>
                <span className="font-mono font-bold text-amber-300">{lotSize} Lot / Entry</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">យុទ្ធសាស្ត្រប្រតិបត្តិ:</span>
                <span className="font-semibold text-cyan-300">DaRa M1 EA (5-Level Pullback)</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              សូមប្រាកដថាអ្នកបានត្រួតពិនិត្យ <strong>Lot Size</strong> និង <strong>Daily Loss Limit</strong> ត្រឹមត្រូវរួចរាល់។
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <p className="text-sm text-slate-300 leading-relaxed">
              តើអ្នកពិតជាចង់ <strong>បិទ LIVE TRADING</strong> មែនទេ?
            </p>
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 leading-relaxed">
              🛡️ ប្រព័ន្ធនឹងប្តូរមកទម្រង់ <strong>Read-Only Monitor (ផ្ទាំងវិភាគ)</strong> វិញភ្លាមៗ ដោយមិនបាញ់ Order ថ្មីចូលទៅកាន់ Broker Exness ទៀតឡើយ។
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            បោះបង់ (Cancel)
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              isEnable 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30' 
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEnable ? 'TURNING ON...' : 'TURNING OFF...'}</span>
              </>
            ) : isEnable ? (
              <>
                <Check className="w-4 h-4" />
                <span>យល់ព្រមបើក (CONFIRM TURN ON)</span>
              </>
            ) : (
              <>
                <Power className="w-4 h-4" />
                <span>យល់ព្រមបិទ (CONFIRM TURN OFF)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
