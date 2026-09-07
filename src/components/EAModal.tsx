import React, { useState } from 'react';
import { X, Download, FileCode, Sliders, CheckCircle2, Server, Copy, Check, Globe } from 'lucide-react';

interface EAModalProps {
  isOpen: boolean;
  onClose: () => void;
  magicNumber: number;
}

export const EAModal: React.FC<EAModalProps> = ({ isOpen, onClose, magicNumber }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-vxbdmp32dvcg3igner5te7-647785726408.us-east1.run.app';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          id="close-ea-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Server size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Exness MT5 + VPS Connection (Option B)</h2>
            <p className="text-xs text-slate-400">ទាញយក EA & បញ្ចូល WebRequest URL លើ MT5 លើ VPS</p>
          </div>
        </div>

        {/* WebRequest URL Copy Section */}
        <div className="mb-6 p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Globe size={14} />
              <span>WebRequest URL (សម្រាប់ Allow ក្នុង MT5):</span>
            </div>
            <button
              id="copy-webrequest-url-btn"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium rounded-md border border-amber-500/40 transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'បាន Copy រួចរាល់!' : 'Copy URL'}</span>
            </button>
          </div>
          <code className="block text-xs font-mono text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 break-all select-all">
            {currentUrl}
          </code>
          <p className="text-[11px] text-slate-400 mt-2">
            ℹ️ ក្នុង MT5 លើ VPS: ចុច <strong>Tools ➔ Options ➔ Expert Advisors ➔ ធីក "Allow WebRequest for listed URL"</strong> រួចចុចសញ្ញា <strong>+</strong> ហើយ Paste URL នេះចូល។
          </p>
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

        {/* Quick 4-Step Setup Instructions */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            ជំហានទាំង ៤ សម្រាប់អ្នកប្រើប្រាស់ (ងាយស្រួល មិនបាច់ចេះ Code)
          </h3>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </div>
              <div>
                <strong className="text-white">ទាញយក Files:</strong> ចុចទាញយក <code className="text-amber-300 font-mono">.mq5</code> និង <code className="text-emerald-300 font-mono">.set</code> ខាងលើ។
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </div>
              <div>
                <strong className="text-white">Copy ចូល MT5 លើ VPS:</strong> លើ MT5 ចុច <em>File ➔ Open Data Folder ➔ MQL5 ➔ Experts</em> រួច Paste File <code className="text-amber-300 font-mono">.mq5</code> ចូល។ ចុច Right-click លើ Navigator រួចចុច <em>Refresh</em>។
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </div>
              <div>
                <strong className="text-white">Allow WebRequest:</strong> ចុច <em>Tools ➔ Options ➔ Expert Advisors</em> រួចធីក <em>"Allow WebRequest for listed URL"</em> ហើយចុច Add URL ខាងលើចូល។
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <div className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                4
              </div>
              <div>
                <strong className="text-white">ភ្ជាប់លើ Chart XAUUSD & បើក Algo Trading:</strong> អូស EA ដាក់លើ Chart XAUUSD (M1 ឬ M5) រួចចុចបើកប៊ូតុង <strong className="text-emerald-400">Algo Trading</strong> ពណ៌បៃតងលើ MT5។ ទិន្នន័យ Live Balance/Equity នឹងបង្ហាញភ្លាមៗ!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
