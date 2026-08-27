import React, { useState } from 'react';
import { X, Server, Check, Link, Unlink, ShieldCheck, AlertCircle } from 'lucide-react';
import { MT5Account, AccountType } from '../types';

interface ConnectMT5ModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: MT5Account;
  onToggleConnection: () => void;
  onSelectAccountType: (type: AccountType) => void;
}

export const ConnectMT5Modal: React.FC<ConnectMT5ModalProps> = ({
  isOpen,
  onClose,
  account,
  onToggleConnection,
  onSelectAccountType,
}) => {
  if (!isOpen) return null;

  const [server, setServer] = useState(account.server || 'Exness-Real21');
  const [loginId, setLoginId] = useState(account.loginId || '8492019');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          id="close-connect-modal-btn"
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
            <h2 className="text-lg font-bold text-white">ភ្ជាប់ Exness MT5 (Connect MT5)</h2>
            <p className="text-xs text-slate-400">ជ្រើសរើសប្រភេទគណនី និងស្ថានភាពភ្ជាប់</p>
          </div>
        </div>

        {/* Account Type Selector (Cent vs Standard) */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-300 mb-2">
            ប្រភេទគណនី (Account Type)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              id="select-cent-account-btn"
              type="button"
              onClick={() => onSelectAccountType('cent')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                account.accountType === 'cent'
                  ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm ring-1 ring-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">Cent (USC)</span>
                {account.accountType === 'cent' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400">សមស្របសម្រាប់ទុនតូច ($10 - $100)</p>
            </button>

            <button
              id="select-standard-account-btn"
              type="button"
              onClick={() => onSelectAccountType('standard')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                account.accountType === 'standard'
                  ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm ring-1 ring-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">Standard (USD)</span>
                {account.accountType === 'standard' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400">សមស្របសម្រាប់ទុនស្តង់ដារ ($500+)</p>
            </button>
          </div>
        </div>

        {/* Current Connection Status Box */}
        <div className="mb-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`relative flex h-3.5 w-3.5`}>
              {account.isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                  account.isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <div>
              <div className="text-xs font-semibold text-white">
                {account.isConnected ? '🟢 បានភ្ជាប់ (Connected)' : '🔴 មិនទាន់ភ្ជាប់ (Disconnected)'}
              </div>
              <div className="text-[11px] text-slate-400">
                Server: {account.server} • Login: {account.loginId}
              </div>
            </div>
          </div>

          <button
            id="toggle-mt5-conn-btn"
            type="button"
            onClick={onToggleConnection}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              account.isConnected
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            {account.isConnected ? (
              <>
                <Unlink size={13} />
                <span>ផ្តាច់ (Disconnect)</span>
              </>
            ) : (
              <>
                <Link size={13} />
                <span>ភ្ជាប់ (Connect)</span>
              </>
            )}
          </button>
        </div>

        {/* Form to change server / login details */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Exness MT5 Server
            </label>
            <input
              id="mt5-server-input"
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="ឧទាហរណ៍: Exness-Real21 ឬ Exness-Trial5"
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              MT5 Account ID / Login
            </label>
            <input
              id="mt5-login-input"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="លេខគណនី MT5"
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2">
            <button
              id="save-mt5-config-btn"
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check size={16} />
                  <span>បានរក្សាទុក!</span>
                </>
              ) : (
                <span>រក្សាទុកព័ត៌មាន (Save)</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
