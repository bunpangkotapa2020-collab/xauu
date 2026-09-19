import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallPWA: () => void;
  isStandalone: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallPWA,
  isStandalone,
}) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Detect device on mount
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      setActiveTab('mobile');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="close-install-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header with App Logo */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20 border border-amber-300/40 shrink-0">
            XAU
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>ដាក់លើ Desktop & Home Screen</span>
            </h2>
            <p className="text-xs text-slate-400">
              បើក Bot ភ្លាមៗដោយចុចតែ 1 ដង (ដូច App ពិតប្រាកដ)
            </p>
          </div>
        </div>

        {/* Device Switcher Tab */}
        <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-6">
          <button
            id="tab-desktop-btn"
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'desktop'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor size={15} />
            <span>💻 Computer Desktop</span>
          </button>
          <button
            id="tab-mobile-btn"
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'mobile'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={15} />
            <span>📱 Mobile Phone (iOS/Android)</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: COMPUTER DESKTOP
        ======================================================== */}
        {activeTab === 'desktop' && (
          <div className="space-y-4">
            {/* Primary Action: One-Click PWA Native App Install */}
            {deferredPrompt ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sparkles size={16} />
                  <span>ដំឡើងជា Desktop App ភ្លាមៗ (One-Click Install)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  កុំព្យូទ័ររបស់អ្នកគាំទ្រការដំឡើងជា App ដោយស្វ័យប្រវត្តិ។ ចុចប៊ូតុងខាងក្រោមដើម្បីដាក់ App Icon លើ Desktop & Taskbar។
                </p>
                <button
                  id="pwa-install-desktop-btn"
                  type="button"
                  onClick={onInstallPWA}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Download size={16} />
                  <span>ចុចទីនេះដើម្បីដំឡើងលើ Computer (Install App)</span>
                </button>
              </div>
            ) : null}

            {/* Option 2: Download Windows Desktop Shortcut (.url file) */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <Monitor size={15} className="text-amber-400" />
                  <span>ទាញយក Desktop Shortcut File (.url)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-300 font-mono rounded">
                  Windows / Mac
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ទាញយក Shortcut នេះរួចដាក់លើ Desktop។ ពេលចុចពីរដង (Double Click) វានឹងបើក Bot ភ្លាមៗដោយភ្ជាប់ទៅ Version ចុងក្រោយបំផុត។
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  id="download-win-shortcut-btn"
                  href="/api/bot/download/shortcut-windows"
                  download="XAUUSD_AI_Scalping_Bot.url"
                  className="py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>ទាញយកសម្រាប់ Windows (.url)</span>
                </a>
                <a
                  id="download-linux-shortcut-btn"
                  href="/api/bot/download/shortcut-linux"
                  download="XAUUSD_AI_Scalping_Bot.desktop"
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>ទាញយក Linux (.desktop)</span>
                </a>
              </div>
            </div>

            {/* Browser Step Instructions for Chrome / Edge */}
            <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-300 block">
                📌 វិធីបង្កើត App តាមរយៈ Chrome / Microsoft Edge:
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px]">
                <li>
                  ចុចសញ្ញាចុចបី <strong className="text-slate-200">⋮</strong> នៅខាងលើស្តាំនៃ Browser
                </li>
                <li>
                  ជ្រើសរើស <strong className="text-amber-300">«Save and share»</strong> ឬ <strong className="text-amber-300">«Apps»</strong>
                </li>
                <li>
                  ចុច <strong className="text-emerald-400">«Install XAU AI SCALPER PRO»</strong> ឬ <strong className="text-emerald-400">«Create shortcut»</strong> (គូសធីក Open as window)
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: MOBILE PHONE (iOS / Android)
        ======================================================== */}
        {activeTab === 'mobile' && (
          <div className="space-y-4">
            {/* Native PWA Prompt if on mobile Android */}
            {deferredPrompt && (
              <button
                id="pwa-install-mobile-btn"
                type="button"
                onClick={onInstallPWA}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Download size={16} />
                <span>ចុចទីនេះដើម្បីដំឡើងលើទូរស័ព្ទ (Add to Home Screen)</span>
              </button>
            )}

            {/* Step for iPhone / iPad (Safari) */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <span>🍎 សម្រាប់ iPhone / iPad (Safari Browser)</span>
              </div>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    បើក Website នេះក្នុង <strong className="text-white">Safari</strong> រួចចុចប៊ូតុង Share <Share2 size={13} className="inline text-cyan-400 mx-1" /> នៅខាងក្រោមអេក្រង់។
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    អូសចុះក្រោមបន្តិច រួចចុច <strong className="text-amber-300">«Add to Home Screen»</strong> (ដាក់លើអេក្រង់ដើម <PlusSquare size={13} className="inline text-amber-400 mx-1" />)។
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div>
                    ចុច <strong className="text-emerald-400">«Add»</strong> នៅខាងលើស្តាំ។ App Icon នឹងបង្ហាញលើ Home Screen ទូរស័ព្ទរបស់អ្នកភ្លាមៗ!
                  </div>
                </div>
              </div>
            </div>

            {/* Step for Android (Chrome) */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <span>🤖 សម្រាប់ Android Phone (Google Chrome)</span>
              </div>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    ចុចសញ្ញាចុចបី <strong className="text-white">⋮</strong> នៅខាងលើស្តាំនៃ Chrome។
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    ចុច <strong className="text-emerald-400">«Install app»</strong> ឬ <strong className="text-emerald-400">«Add to Home screen»</strong>។
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Important Guarantees Checklist */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span><strong>Always Latest Version:</strong> ពេលបើកពី Icon វានឹង Update ស្វ័យប្រវត្តិតាម Bot Server ចុងក្រោយជានិច្ច មិនបាច់បង្កើត Shortcut ឡើងវិញទេ។</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
            <span><strong>Persistent Session:</strong> Login Session ត្រូវបានរក្សាទុកដោយសុវត្ថិភាព មិនបាច់ Login សារឡើងវិញរាល់ពេលបើក App ទេ។</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
            <span><strong>Native App Feel:</strong> បើកជាផ្ទាំង Standalone ពេញអេក្រង់ គ្មាន URL bar រំខាន។</span>
          </div>
        </div>
      </div>
    </div>
  );
};
