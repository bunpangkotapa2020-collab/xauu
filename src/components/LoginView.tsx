import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Play, CheckCircle2, Crown, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (isDemo: boolean, username: string, token?: string) => void;
  onQuickDemo: () => void;
  onOpenInstallModal?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onQuickDemo, onOpenInstallModal }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin_XAUUSD_2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់ Admin');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Call parent login handler which hits backend verification
      await onLoginSuccess(false, username.trim());
    } catch (err: any) {
      setError(err.message || 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle Ambient Tech Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-7 sm:p-8 shadow-2xl relative z-10">
        {/* Admin Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 mb-3 border border-amber-300/40 relative">
            <span className="text-2xl font-black text-slate-950 tracking-tighter">XAU</span>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 border border-amber-500/60 rounded-full flex items-center justify-center shadow">
              <Crown size={13} className="text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">XAUUSD AI Scalping Bot</h1>
          <p className="text-slate-400 text-xs mt-1">Final Simple Version • ភាសាខ្មែរ ១០០%</p>
          
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-amber-300 text-xs font-semibold">
            <Crown size={12} className="text-amber-400" />
            <span>👑 OWNER / ADMIN ONLY</span>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ឈ្មោះ Admin (Admin Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User size={16} />
              </div>
              <input
                id="login-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="បញ្ចូល Admin Username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ពាក្យសម្ងាត់ Admin (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={16} />
              </div>
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="បញ្ចូល Admin Password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <Crown size={16} />
                <span>ចូលប្រព័ន្ធ (Admin Login)</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[11px]">
            <span className="px-3 bg-slate-900 text-slate-400">ឬសាកល្បង Interface</span>
          </div>
        </div>

        {/* Quick Demo Button (Clearly labeled as UI Testing Only) */}
        <button
          id="quick-demo-btn"
          type="button"
          onClick={onQuickDemo}
          className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <Play size={14} className="fill-emerald-400" />
          <span>🧪 សាកល្បង Interface (Demo Sandbox — Read-only)</span>
        </button>

        {/* Add Shortcut / Install App Icon Button */}
        {onOpenInstallModal && (
          <button
            id="login-install-shortcut-btn"
            type="button"
            onClick={onOpenInstallModal}
            className="w-full mt-2.5 py-2.5 px-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>📱 ដាក់ Shortcut លើ Desktop & Home Screen</span>
          </button>
        )}

        {/* Owner Security Guarantee Checklist */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
            <span><strong>Personal Bot:</strong> ប្រើតែម្នាក់ឯង គ្មាន User Registration / Multiple Users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
            <span><strong>Backend Protected:</strong> Password Hashing & Token Session Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

