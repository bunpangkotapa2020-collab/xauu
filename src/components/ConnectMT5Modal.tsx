import React, { useState } from 'react';
import { X, ShieldCheck, RefreshCw, Link2, AlertCircle, Eye, EyeOff, CheckCircle2, Lock, Server, UserCheck, DollarSign } from 'lucide-react';
import { botApi } from '../services/api';

interface ConnectMT5ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (data: any) => void;
  currentLoginId?: string;
  currentServer?: string;
  currentAccountType?: 'cent';
}

const POPULAR_SERVERS = [
  'Exness-Real',
  'Exness-Real21',
  'Exness-Real1',
  'Exness-Real2',
  'Exness-Real3',
  'Exness-Real5',
  'Exness-Real10',
  'Exness-Real15',
  'Exness-Real20',
];

export const ConnectMT5Modal: React.FC<ConnectMT5ModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  currentLoginId = '',
  currentServer = 'Exness-Real21',
  currentAccountType = 'cent',
}) => {
  const [loginId, setLoginId] = useState(currentLoginId);
  const [password, setPassword] = useState('');
  const [server, setServer] = useState(currentServer);
  const [accountType, setAccountType] = useState<'cent'>('cent');
  const [apiKey, setApiKey] = useState('');
  const [bridgeUrl, setBridgeUrl] = useState('https://mt-client-api-v1.backup-new-york.agiliumtrade.ai');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResult(null);

    const cleanLogin = loginId.trim();
    const cleanPass = password.trim();
    const cleanServer = server.trim();
    const cleanApiKey = apiKey.trim();
    const cleanBridgeUrl = bridgeUrl.trim();

    if (!cleanLogin) {
      setErrorMsg('សូមបញ្ចូល MT5 Login ID (លេខ Account)');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('សូមបញ្ចូល MT5 Password');
      return;
    }
    if (!cleanServer) {
      setErrorMsg('សូមជ្រើសរើស ឬបញ្ចូល Exness MT5 Server');
      return;
    }
    if (!cleanApiKey) {
      setErrorMsg('សូមបញ្ចូល MT5 API Key');
      return;
    }
    if (!cleanBridgeUrl) {
      setErrorMsg('សូមបញ្ចូល MT5 Bridge URL');
      return;
    }

    if (/demo|trial/i.test(cleanServer)) {
      setErrorMsg('⚠️ អនុញ្ញាតតែ Exness Real Server ប៉ុណ្ណោះ! សូមជ្រើសរើស Real Server (ឧ. Exness-Real21, Exness-Real) មិនមែន Demo ឡើយ។');
      return;
    }

    setLoading(true);

    try {
      // Direct call to secure verification endpoint
      const res = await botApi.verifyAndConnectMT5({
        loginId: cleanLogin,
        password: cleanPass,
        server: cleanServer,
        accountType,
        apiKey: cleanApiKey,
        bridgeUrl: cleanBridgeUrl,
      });

      // Clear password from component state immediately for security
      setPassword('');

      if (!res.success) {
        throw new Error(res.error || 'Connection verification failed');
      }

      setResult(res);
      if (onVerified) {
        onVerified(res);
      }
    } catch (err: any) {
      // Clear password on error as well
      setPassword('');
      setErrorMsg(err.message || '🔴 CONNECTION ERROR: បរាជ័យក្នុងការភ្ជាប់ទៅកាន់ MT5 Real Server');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clear password state on close
    setPassword('');
    setErrorMsg('');
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">ភ្ជាប់គណនីពិត Exness MT5 (Real Login)</h2>
              <p className="text-[11px] text-slate-400">Secure Direct Handshake & Live Verification</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 text-slate-200 text-xs">
          
          {/* Security Banner */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <span className="font-bold text-emerald-400 block mb-0.5">🔒 សុវត្ថិភាព 100% (Zero Password Storage):</span>
              ពាក្យសម្ងាត់ត្រូវបានប្រើតែម្តងសម្រាប់ Secure Handshake ទៅ MT5 Bridge ផ្ទាល់។ មិនត្រូវបានរក្សាទុកក្នុង LocalStorage, Session, ឬ Server Log ឡើយ។
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            
            {/* 1. MT5 Login ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>MT5 Login ID</span>
                <span className="text-[10px] text-slate-400 font-normal">លេខ Account Exness</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="បញ្ចូលលេខ Account (ឧ. 8492019)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* 2. MT5 Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>MT5 Password</span>
                <span className="text-[10px] text-slate-400 font-normal">ពាក្យសម្ងាត់ MT5</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 3. MT5 Server */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>MT5 Server</span>
                <span className="text-[10px] text-emerald-400 font-normal">Exness Real Server</span>
              </label>
              <input
                type="text"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="Exness-Real21"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600 mb-2"
                required
              />
              {/* Quick Server Select Badges */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-500 self-center mr-1">Server ញឹកញាប់:</span>
                {POPULAR_SERVERS.map((srv) => (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => setServer(srv)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                      server === srv
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. MT5 API Key */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>MT5 API Key</span>
                <span className="text-[10px] text-slate-400 font-normal">MetaApi Token</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="eyJhbG..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* 5. MT5 Bridge URL */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>MT5 Bridge URL</span>
              </label>
              <input
                type="text"
                value={bridgeUrl}
                onChange={(e) => setBridgeUrl(e.target.value)}
                placeholder="https://mt-client-api-v1.backup-new-york.agiliumtrade.ai"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
                required
              />
            </div>

            {/* 6. Account Type Selection */}
            <div className="hidden">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                ប្រភេទ Account (Account Type)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('cent')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    accountType === 'cent'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs">Cent (USC)</span>
                  <span className="text-[10px] opacity-75">សម្រាប់ទុនតូច $10 - $50</span>
                </button>
              </div>
            </div>

            {/* Submit Button: VERIFY & CONNECT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 uppercase tracking-wide cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>កំពុងផ្ទៀងផ្ទាត់ និងភ្ជាប់ Exness MT5...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>VERIFY & CONNECT</span>
                </>
              )}
            </button>
          </form>

          {/* Results Area */}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs sm:text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>🔴 CONNECTION ERROR / NOT READY</span>
              </div>
              <p className="text-rose-300 text-xs whitespace-pre-wrap leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 size={18} />
                  <span>🟢 REAL MT5 CONNECTED</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold">
                  VERIFIED
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">💰 Real Balance</span>
                  <span className="text-white font-mono font-bold text-xs sm:text-sm">
                    {result.balance} {result.currency}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">💵 Real Equity</span>
                  <span className="text-white font-mono font-bold text-xs sm:text-sm">
                    {result.equity} {result.currency}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">💳 Free Margin</span>
                  <span className="text-white font-mono font-bold text-xs sm:text-sm">
                    {result.freeMargin} {result.currency}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Live XAUUSD Bid/Ask</span>
                  <span className="text-amber-400 font-mono font-bold text-xs">
                    ${result.bid} / ${result.ask}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                <span className="text-slate-400">Trading Permission:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{result.tradingPermission ? '🟢 Trading Allowed' : '🔴 Denied'}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
              >
                រួចរាល់ — ចូលទៅកាន់ Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
