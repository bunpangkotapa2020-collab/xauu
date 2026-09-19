import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, CheckCircle2, Crown, Sparkles, KeyRound, Copy, Check, RefreshCw, Settings, CheckCheck, Server } from 'lucide-react';
import { botApi } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (username: string, password?: string) => Promise<void>;
  onOpenInstallModal?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenInstallModal }) => {
  // Tab: 'login' | 'setup'
  const [activeTab, setActiveTab] = useState<'login' | 'setup'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Custom Setup state (Owner sets their own Username & Password)
  const [customUsername, setCustomUsername] = useState('admin');
  const [customPassword, setCustomPassword] = useState('');
  const [customConfirmPass, setCustomConfirmPass] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  // Forgot / Reset Password state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetPin, setResetPin] = useState('');
  const [resetNewUser, setResetNewUser] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // Fetch initial auth info from server on mount
  useEffect(() => {
    let isMounted = true;
    botApi.getAuthInfo().then((info) => {
      if (isMounted && info?.username) {
        const cleanUser = (!info.username || info.username.toUpperCase() === 'MT5') ? 'admin' : info.username;
        // Do NOT auto-fill the login username input
        setCustomUsername(cleanUser);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('សូមបញ្ចូលឈ្មោះ Admin (Username) និងពាក្យសម្ងាត់ (Password)');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Forward real username and password to backend authentication
      await onLoginSuccess(username.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់ Admin មិនត្រឹមត្រូវ (Invalid Credentials)');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess('');

    const cleanUser = customUsername.trim();
    const cleanPass = customPassword.trim();
    const cleanConfirm = customConfirmPass.trim();

    if (!cleanUser || !cleanPass) {
      setSetupError('សូមបញ្ចូល Username និង Password ដែលអ្នកចង់កំណត់');
      return;
    }

    if (cleanUser.length < 2) {
      setSetupError('Username ត្រូវមានយ៉ាងតិច ២ តួអក្សរ');
      return;
    }

    if (cleanPass.length < 4) {
      setSetupError('Password ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ (អាចប្រើអក្សរ + លេខ ងាយៗ)');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setSetupError('Password ទាំងពីរមិនដូចគ្នាទេ សូមពិនិត្យម្តងទៀត');
      return;
    }

    setSetupLoading(true);
    try {
      const res = await botApi.setupCredentials(cleanUser, cleanPass);
      setSetupSuccess(res.message || 'បានកំណត់ Username និង Password ដោយជោគជ័យ!');
      
      // Auto login immediately
      setTimeout(async () => {
        try {
          await onLoginSuccess(cleanUser, cleanPass);
        } catch {
          setActiveTab('login');
          setUsername(cleanUser);
          setPassword(cleanPass);
        }
      }, 700);
    } catch (err: any) {
      setSetupError(err.message || 'បរាជ័យក្នុងការកំណត់ Admin Account');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEmergencyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPin.trim() || !resetNewPass.trim()) {
      setResetError('សូមបញ្ចូល Recovery PIN និងពាក្យសម្ងាត់ថ្មី');
      return;
    }
    if (resetNewPass.trim().length < 4) {
      setResetError('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៤ តួអក្សរ');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      const res = await botApi.resetPassword(resetPin.trim(), resetNewPass.trim(), resetNewUser.trim() || undefined);
      setResetMessage(res.message || 'បាន Reset ពាក្យសម្ងាត់ជោគជ័យ! សូម Login ឥឡូវនេះ');
      if (resetNewUser.trim()) setUsername(resetNewUser.trim());
      setPassword(resetNewPass.trim());
      setTimeout(() => {
        setIsResetOpen(false);
        setResetMessage('');
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'បរាជ័យក្នុងការ Reset ពាក្យសម្ងាត់');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 md:p-8 relative overflow-hidden font-sans w-full">
      {/* Subtle Ambient Tech Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-60 sm:w-80 h-60 sm:h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md glass-card rounded-2xl p-4 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative z-10 my-auto border-slate-700/60">
        {/* Admin Header */}
        <div className="text-center mb-4 sm:mb-5">
          <div className="inline-flex items-center justify-center mb-2 sm:mb-2.5">
            <img src="/logo.png" alt="XAU Logo" className="w-14 h-14 sm:w-[72px] sm:h-[72px] object-contain drop-shadow-xl" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">XAU AI SCALPER PRO</h1>
          <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5">ភាសាខ្មែរ ១០០% • Single Owner Account</p>
          
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-[10px] sm:text-xs font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <Crown size={11} className="text-amber-400" />
            <span>👑 គណនី ADMIN / OWNER</span>
          </div>
        </div>

        {/* ========================================================
            LOGIN FORM
        ======================================================== */}
        
          <div>
            {error && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-3.5">
              <div>
                <label className="block text-center text-xs font-semibold text-slate-300 mb-1">
                  ឈ្មោះ Admin (Admin Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User size={15} />
                  </div>
                  <input
                    id="login-username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="បញ្ចូល Admin Username"
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-mono min-h-[42px] sm:min-h-[46px]"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center mb-1">
                  <label className="block text-center text-xs font-semibold text-slate-300">
                    ពាក្យសម្ងាត់ Admin (Password)
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock size={15} />
                  </div>
                  <input
                    id="login-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="បញ្ចូល Password (អក្សរ + លេខ)"
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-mono min-h-[42px] sm:min-h-[46px]"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-3 sm:py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] sm:min-h-[48px] btn-glow-amber"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw size={15} className="animate-spin" />
                    <span>កំពុងផ្ទៀងផ្ទាត់ Admin...</span>
                  </span>
                ) : (
                  <>
                    <Crown size={16} />
                    <span>ចូលប្រព័ន្ធ (Admin Login)</span>
                  </>
                )}
              </button>
            </form>
          </div>

        {/* Owner Security Guarantee Checklist */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-[10px] sm:text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck size={14} className="shrink-0" />
            <span>SECURITY POLICY (DISPLAY ONLY)</span>
          </div>
          <div className="flex items-center gap-2">
            <Server size={12} className="shrink-0 text-slate-500" />
            <span>Real Trading Account Connection 100%</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={12} className="shrink-0 text-slate-500" />
            <span>Encrypted Authentication & Session</span>
          </div>
        </div>
      </div>

      {/* Emergency Reset Password Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={17} className="text-amber-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">Admin Password Recovery</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              បញ្ចូល <strong>Emergency Recovery PIN</strong> ដើម្បី Reset ឬផ្លាស់ប្តូរពាក្យសម្ងាត់ Admin ឡើងវិញ៖
            </p>

            {resetError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                ⚠️ {resetError}
              </div>
            )}

            {resetMessage && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                ✅ {resetMessage}
              </div>
            )}

            <form onSubmit={handleEmergencyReset} className="space-y-3">
              <div>
                <label className="block text-center text-xs text-slate-300 mb-1">Emergency Recovery PIN</label>
                <input
                  type="text"
                  value={resetPin}
                  onChange={(e) => setResetPin(e.target.value)}
                  placeholder="ឧ. 948210"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-center text-xs text-slate-300 mb-1">ឈ្មោះ Admin ថ្មី (ជម្រើស)</label>
                <input
                  type="text"
                  value={resetNewUser}
                  onChange={(e) => setResetNewUser(e.target.value)}
                  placeholder="ទុកទំនេរ ឬបញ្ចូល Username ថ្មី"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-center text-xs text-slate-300 mb-1">ពាក្យសម្ងាត់ Admin ថ្មី</label>
                <input
                  type="password"
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="ពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៤ តួអក្សរ)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? 'កំពុង Reset...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
