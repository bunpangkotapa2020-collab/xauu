import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  XOctagon,
  Server,
  Activity,
  ShieldCheck,
  Clock,
  Download,
  LogOut,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Info,
  Crown,
  X
} from 'lucide-react';
import { BotState, AccountType } from '../types';
import { ConnectMT5Modal } from './ConnectMT5Modal';
import { EAModal } from './EAModal';
import { InteractiveTestPanel } from './InteractiveTestPanel';

interface MainDashboardProps {
  botState: BotState;
  onAction: (action: any, payload?: any) => Promise<void>;
  onSimulateTest: (testType: any) => Promise<void>;
  onLogout: () => void;
  currentUser: string;
  onOpenInstallModal?: () => void;
  isStandalone?: boolean;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  botState,
  onAction,
  onSimulateTest,
  onLogout,
  currentUser,
  onOpenInstallModal,
  isStandalone,
}) => {
  const [isMT5ModalOpen, setIsMT5ModalOpen] = useState(false);
  const [isEAModalOpen, setIsEAModalOpen] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [startHour, setStartHour] = useState(botState.tradingHours.startHour);
  const [stopHour, setStopHour] = useState(botState.tradingHours.stopHour);

  const handleSaveHours = async () => {
    await onAction('update_trading_hours', { startHour, stopHour, enabled: true });
    setIsEditingHours(false);
  };

  const getStatusBadge = () => {
    switch (botState.status) {
      case 'running':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>🟢 កំពុងដំណើរការ (Running)</span>
          </div>
        );
      case 'paused':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
            <span>⏸️ បានផ្អាក (Paused)</span>
          </div>
        );
      case 'daily_limit_hit':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-300 rounded-full text-xs font-bold animate-pulse">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
            <span>🛑 ដល់កម្រិតខាតប្រចាំថ្ងៃ (Daily Limit Hit)</span>
          </div>
        );
      case 'stopped':
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-xs font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span>🔴 បានបញ្ឈប់ (Stopped)</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Top Demo Banner if in Demo */}
      {botState.isDemo && (
        <div className="bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-emerald-700/90 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 border-b border-emerald-500/40 shadow-sm">
          <Sparkles size={14} />
          <span>🧪 DEMO MODE — សម្រាប់សាកល្បង Interface និង Logic ដោយសុវត្ថិភាព (មិនប៉ះពាល់ Live Account)</span>
        </div>
      )}

      {/* Navigation & Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-amber-500/20">
              XAU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight">
                  XAUUSD AI Scalping Bot
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-md font-semibold">
                  <Crown size={10} className="text-amber-400" />
                  <span>{botState.isDemo ? 'Demo Sandbox' : '👑 Owner Admin'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">ប្រព័ន្ធគ្រប់គ្រងផ្ទាល់ខ្លួន • “User មើលតិច — Bot ធ្វើការច្រើន”</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* MT5 Connection Status Toggle Button */}
            <button
              id="header-mt5-conn-btn"
              type="button"
              onClick={() => setIsMT5ModalOpen(true)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                botState.account.isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${botState.account.isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span className="hidden sm:inline">
                {botState.account.isConnected ? '🟢 MT5 Connected' : '🔴 MT5 Disconnected'}
              </span>
              <span className="sm:hidden">
                {botState.account.isConnected ? 'MT5' : 'Disconnected'}
              </span>
            </button>

            {/* VPS Status Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>🟢 VPS 24/7 Online</span>
            </div>

            {/* Install / Shortcut Button */}
            {onOpenInstallModal && (
              <button
                id="header-install-app-btn"
                type="button"
                onClick={onOpenInstallModal}
                className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="ដាក់ Shortcut លើ Desktop / Home Screen"
              >
                <Sparkles size={14} className="text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">📱 Shortcut / App Icon</span>
                <span className="sm:hidden">App Icon</span>
              </button>
            )}

            {/* Download EA Button */}
            <button
              id="header-download-ea-btn"
              type="button"
              onClick={() => setIsEAModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-amber-300 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">ទាញយក EA</span>
            </button>

            {/* Logout */}
            <button
              id="header-logout-btn"
              type="button"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="ចាកចេញ (Logout)"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* ========================================================
            1. STATUS & BALANCE / P&L ROW
        ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bot Status & Market Ticker Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                ស្ថានភាព Bot (Bot Status)
              </span>
              {getStatusBadge()}
            </div>

            <div className="space-y-2 my-2">
              <div className="text-sm font-semibold text-white">
                {botState.statusMessageKhmer}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div>
                  តម្លៃមាសបច្ចុប្បន្ន: <strong className="text-amber-400 font-mono">${botState.goldPrice.toFixed(2)}</strong>
                </div>
                <div>
                  Spread: <span className="text-slate-300 font-mono">{botState.spreadPoints} pts</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-slate-500" />
                <span>ម៉ោង Server: <strong className="text-slate-200 font-mono">{botState.serverTime}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${botState.isInsideTradingHours ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{botState.isInsideTradingHours ? 'ក្នុងម៉ោង Trading' : 'ក្រៅម៉ោង Trading'}</span>
              </div>
            </div>
          </div>

          {/* Account Balance & Today P/L Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  សមតុល្យគណនី (Balance)
                </span>
                <button
                  id="switch-account-type-btn"
                  onClick={() => onAction('toggle_account_type')}
                  className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-mono transition-colors"
                  title="ចុចដើម្បីប្តូររវាង Cent និង Standard"
                >
                  {botState.account.accountType === 'cent' ? '🪙 Cent (USC)' : '💵 Standard (USD)'}
                </button>
              </div>

              <span className="text-xs text-slate-400">
                Equity: <strong className="text-white font-mono">{botState.account.equity.toLocaleString()} {botState.account.currency}</strong>
              </span>
            </div>

            <div className="flex items-baseline justify-between my-2">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {botState.account.balance.toLocaleString()} <span className="text-sm font-semibold text-amber-400">{botState.account.currency}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Server: {botState.account.server} • ID: {botState.account.loginId}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">ចំណេញ/ខាតថ្ងៃនេះ (Today P/L)</span>
                <div
                  className={`text-xl sm:text-2xl font-black font-mono flex items-center justify-end gap-1 ${
                    botState.todayProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {botState.todayProfitLoss >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  <span>{botState.todayProfitLoss >= 0 ? '+' : ''}{botState.todayProfitLoss.toLocaleString()} {botState.account.currency}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>សរុប Trade ថ្ងៃនេះ: <strong className="text-white font-mono">{botState.todayTradeCount}</strong></span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">ឈ្នះ: <strong>{botState.todayWinCount}</strong></span>
                <span className="text-rose-400">ចាញ់: <strong>{botState.todayLossCount}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. 🎛️ ACTION CONTROLS — 4 BIG BUTTONS
        ======================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎛️ ប៊ូតុងបញ្ជាធំៗ ៤ (Action Controls)</span>
            </h2>
            <span className="text-[11px] text-slate-500">ចុចដើម្បីបញ្ជា Bot ដោយផ្ទាល់</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. START */}
            <button
              id="action-start-btn"
              type="button"
              onClick={() => onAction('start')}
              disabled={botState.status === 'running' || botState.dailyLossLimitHit}
              className={`p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer font-bold shadow-lg ${
                botState.status === 'running'
                  ? 'bg-emerald-600/30 border-2 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                  : botState.dailyLossLimitHit
                  ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-2 border-emerald-500/40 hover:border-emerald-500 text-emerald-400 active:scale-[0.98]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                <Play size={24} className="fill-slate-950" />
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg">START</div>
                <div className="text-xs font-normal text-emerald-300/80">ចាប់ផ្តើម</div>
              </div>
            </button>

            {/* 2. PAUSE */}
            <button
              id="action-pause-btn"
              type="button"
              onClick={() => onAction('pause')}
              disabled={botState.status === 'paused'}
              className={`p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer font-bold shadow-lg ${
                botState.status === 'paused'
                  ? 'bg-amber-600/30 border-2 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-500/40 hover:border-amber-500 text-amber-400 active:scale-[0.98]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                <Pause size={24} className="fill-slate-950" />
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg">PAUSE</div>
                <div className="text-xs font-normal text-amber-300/80">ផ្អាក</div>
              </div>
            </button>

            {/* 3. STOP */}
            <button
              id="action-stop-btn"
              type="button"
              onClick={() => onAction('stop')}
              disabled={botState.status === 'stopped'}
              className={`p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer font-bold shadow-lg ${
                botState.status === 'stopped'
                  ? 'bg-rose-600/30 border-2 border-rose-500 text-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 border-2 border-rose-500/40 hover:border-rose-500 text-rose-400 active:scale-[0.98]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-slate-950 flex items-center justify-center shadow-md">
                <Square size={22} className="fill-slate-950" />
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg">STOP</div>
                <div className="text-xs font-normal text-rose-300/80">បញ្ឈប់</div>
              </div>
            </button>

            {/* 4. CLOSE ALL */}
            <button
              id="action-close-all-btn"
              type="button"
              onClick={() => onAction('close_all')}
              className="p-4 sm:p-5 rounded-2xl bg-red-950/40 hover:bg-red-950/70 border-2 border-red-500/50 hover:border-red-500 text-red-300 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer font-bold shadow-lg active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <XOctagon size={24} />
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg">CLOSE ALL</div>
                <div className="text-[11px] font-normal text-red-300/80">បិទតែ Trade Bot ({botState.magicNumber})</div>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================
            3. 📊 CURRENT TRADE (TRADE កំពុងដំណើរការ)
        ======================================================== */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Trade កំពុងដំណើរការ (Current Trade)
              </h2>
            </div>
            {botState.currentTrade && (
              <span className="text-xs px-2.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md font-mono">
                Magic: {botState.currentTrade.magicNumber}
              </span>
            )}
          </div>

          {botState.currentTrade ? (
            <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Trade Details */}
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-2 rounded-xl text-center font-black text-sm ${
                      botState.currentTrade.side === 'BUY'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-rose-500 text-slate-950'
                    }`}
                  >
                    {botState.currentTrade.side}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>XAUUSD</span>
                      <span className="text-slate-400 font-normal text-xs font-mono">
                        {botState.currentTrade.lot} Lot
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      បើកនៅម៉ោង: {botState.currentTrade.openedAt}
                    </div>
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Entry Price:</span>
                    <strong className="text-white font-mono">${botState.currentTrade.entryPrice.toFixed(2)}</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Live Price:</span>
                    <strong className="text-amber-400 font-mono">${botState.currentTrade.currentPrice.toFixed(2)}</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-rose-400 block text-[10px]">Stop Loss (SL):</span>
                    <strong className="text-rose-300 font-mono">${botState.currentTrade.sl.toFixed(2)}</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 block text-[10px]">Take Profit (TP):</span>
                    <strong className="text-emerald-300 font-mono">${botState.currentTrade.tp.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Floating P/L & Close Button */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Floating P/L</span>
                    <div
                      className={`text-lg sm:text-xl font-black font-mono ${
                        botState.currentTrade.floatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {botState.currentTrade.floatingProfit >= 0 ? '+' : ''}
                      {botState.currentTrade.floatingProfit.toLocaleString()} {botState.account.currency}
                    </div>
                  </div>

                  <button
                    id="close-single-trade-btn"
                    type="button"
                    onClick={() => onAction('close_single')}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/40 hover:border-rose-500 text-rose-400 font-bold rounded-xl text-xs transition-colors"
                  >
                    បិទ Trade
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
              <p className="text-slate-400 text-sm font-medium">មិនមាន Trade កំពុងដំណើរការ</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {botState.status === 'running'
                  ? '🟢 Bot កំពុងស្កេនរកឱកាសចូល Trade តាម Risk Strategy...'
                  : 'ចុច «START» ដើម្បីឱ្យ Bot ចាប់ផ្តើមវិភាគ និងបើក Trade'}
              </p>
            </div>
          )}
        </div>

        {/* ========================================================
            4. COEXISTENCE OF MANUAL TRADES (MAGIC NUMBER ISOLATION)
        ======================================================== */}
        {botState.manualTrades && botState.manualTrades.length > 0 && (
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <h3 className="text-xs font-bold text-indigo-300">
                  Manual Trade របស់ User (Magic Number: 0)
                </h3>
              </div>
              <span className="text-[11px] text-indigo-400 font-medium">
                🛡️ មិនត្រូវប៉ះពាល់ពេលចុច «CLOSE ALL»
              </span>
            </div>
            {botState.manualTrades.map((mTrade) => (
              <div key={mTrade.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500 text-slate-950 font-bold rounded text-[11px]">
                    {mTrade.side}
                  </span>
                  <span className="text-white font-mono">{mTrade.lot} Lot XAUUSD @ ${mTrade.entryPrice}</span>
                </div>
                <div className="text-emerald-400 font-mono font-bold">
                  +${mTrade.floatingProfit} USD
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================
            5. TRADING HOURS & INTERNAL CAPITAL PROTECTION
        ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trading Hours Configuration */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    ⚙️ ម៉ោងជួញដូរ (Trading Hours)
                  </h3>
                </div>

                <button
                  id="edit-trading-hours-btn"
                  type="button"
                  onClick={() => setIsEditingHours(!isEditingHours)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  {isEditingHours ? 'បោះបង់' : 'កែប្រែម៉ោង'}
                </button>
              </div>

              {isEditingHours ? (
                <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">ម៉ោងចាប់ផ្តើម (Start)</label>
                      <input
                        id="start-hour-input"
                        type="time"
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">ម៉ោងបញ្ឈប់ (Stop)</label>
                      <input
                        id="stop-hour-input"
                        type="time"
                        value={stopHour}
                        onChange={(e) => setStopHour(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                  <button
                    id="save-trading-hours-btn"
                    type="button"
                    onClick={handleSaveHours}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    រក្សាទុកម៉ោងជួញដូរ
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">ម៉ោងកំណត់ដំណើរការ:</span>
                    <strong className="text-sm text-white font-mono">
                      {botState.tradingHours.startHour} — {botState.tradingHours.stopHour}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        botState.isInsideTradingHours
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {botState.isInsideTradingHours ? '🟢 កំពុងក្នុងម៉ោងជួញដូរ' : '⏸️ ក្រៅម៉ោងជួញដូរ'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              💡 ដល់ម៉ោង Stop ត្រូវឱ្យ Bot ឈប់បើក Trade ថ្មីដោយស្វ័យប្រវត្តិ។ Trade ដែលកំពុងបើកនៅតែអនុវត្តតាម Exit/Risk Rules ដែលបានកំណត់។
            </p>
          </div>

          {/* Internal Capital Protection */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  🛡️ ប្រព័ន្ធការពារទុន (Capital Protection)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% ស្វ័យប្រវត្តិ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 p-2 bg-slate-950/50 rounded-lg border border-slate-800/80">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Mandatory Stop Loss</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-950/50 rounded-lg border border-slate-800/80">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Daily Loss Limit (${botState.riskConfig.maxDailyLoss})</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-950/50 rounded-lg border border-slate-800/80">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Spread Filter (&lt; 25 pts)</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-950/50 rounded-lg border border-slate-800/80">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>News Filter</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-950/50 rounded-lg border border-slate-800/80">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>No Martingale / No Grid</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-950/50 rounded-lg border border-slate-800/80">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Magic Number: {botState.magicNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            6. INTERACTIVE FLOW TESTER (REQUIREMENT 13 COMPLIANCE)
        ======================================================== */}
        <InteractiveTestPanel
          botState={botState}
          onAction={onAction}
          onSimulateTest={onSimulateTest}
        />
      </main>

      {/* Modals */}
      <ConnectMT5Modal
        isOpen={isMT5ModalOpen}
        onClose={() => setIsMT5ModalOpen(false)}
        account={botState.account}
        onToggleConnection={() => onAction('toggle_connection')}
        onSelectAccountType={(type) => onAction('toggle_account_type', { accountType: type })}
      />

      <EAModal
        isOpen={isEAModalOpen}
        onClose={() => setIsEAModalOpen(false)}
        magicNumber={botState.magicNumber}
      />
    </div>
  );
};
