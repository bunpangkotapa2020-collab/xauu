import React from 'react';
import { X, Download, FileCode, Sliders, CheckCircle2, Server } from 'lucide-react';

interface EAModalProps {
  isOpen: boolean;
  onClose: () => void;
  magicNumber: number;
}

export const EAModal: React.FC<EAModalProps> = ({ isOpen, onClose, magicNumber }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          id="close-ea-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Server size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">EA / MetaTrader 5 VPS</h2>
            <p className="text-xs text-slate-400">ទាញយក Files សម្រាប់ដាក់លើ Exness MT5 / VPS</p>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <a
            id="download-mq5-ea-btn"
            href="/api/bot/download/ea"
            download="XAUUSD_AI_Scalping_v3.mq5"
            className="p-4 bg-slate-950/80 hover:bg-slate-950 border border-amber-500/30 rounded-xl flex flex-col justify-between transition-all group hover:border-amber-500/60"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <FileCode size={20} className="text-amber-400" />
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-300 font-mono rounded">
                  .mq5
                </span>
              </div>
              <div className="font-bold text-sm text-white">EA Source Code</div>
              <p className="text-xs text-slate-400 mt-1">XAUUSD AI Scalping Expert Advisor</p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold group-hover:underline">
              <Download size={14} />
              <span>ទាញយក .mq5</span>
            </div>
          </a>

          <a
            id="download-preset-btn"
            href="/api/bot/download/preset"
            download="XAUUSD_Scalping_Preset.set"
            className="p-4 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between transition-all group hover:border-slate-700"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Sliders size={20} className="text-emerald-400" />
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-300 font-mono rounded">
                  .set
                </span>
              </div>
              <div className="font-bold text-sm text-white">Preset Settings</div>
              <p className="text-xs text-slate-400 mt-1">ការកំណត់ហានិភ័យ & Scalping សម្រាប់មាស</p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold group-hover:underline">
              <Download size={14} />
              <span>ទាញយក .set</span>
            </div>
          </a>
        </div>

        {/* Protection Note */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Magic Number របស់ Bot:</span>
            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {magicNumber}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            🛡️ Bot ប្រើ Magic Number នេះដើម្បីសម្គាល់ និងគ្រប់គ្រងតែ Trade ផ្ទាល់ខ្លួនរបស់ Bot។ ពេលចុច «CLOSE ALL» វាមិនប៉ះពាល់ដល់ Manual Trade របស់អ្នកឡើយ។
          </p>
        </div>

        {/* Quick 3-Step Setup Instructions */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            របៀបដាក់លើ MT5 / VPS (៣ ជំហាន)
          </h3>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </div>
              <div>
                <strong className="text-white">Copy File ចូល MT5:</strong> ដាក់ File <code className="text-amber-300 font-mono">.mq5</code> ក្នុង Folder <code className="text-slate-400 font-mono">MQL5/Experts</code>។
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </div>
              <div>
                <strong className="text-white">Load Preset:</strong> បើក Chart XAUUSD (M1 ឬ M5) ទាញ EA ចូល រួចចុច <em>Load .set Preset</em>។
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <div className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </div>
              <div>
                <strong className="text-white">បើកដំណើរការ:</strong> ចុចបើក <strong className="text-emerald-400">Algo Trading (AutoTrading)</strong> លើ MT5។ Bot នឹងដំណើរការ ២៤/៧។
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
