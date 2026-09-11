import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Shield, Clock, Server, CheckCircle2, Save, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { BotState } from '../types';
import { botApi } from '../services/api';
import { useLiveTradingToggle } from '../hooks/useLiveTradingToggle';
import { LiveTradingConfirmModal } from './LiveTradingConfirmModal';

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
  // Live Trading Controller
  const {
    isLiveEnabled,
    isSubmitting: isChangingLive,
    isOpenModal: isLiveModalOpen,
    modalAction: liveModalAction,
    errorMessage: liveErrorMessage,
    handleToggleClick,
    handleConfirm: handleConfirmLive,
    handleClose: handleCloseLive,
  } = useLiveTradingToggle(botState, onSaveSuccess);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // Form states
  const [lotSize, setLotSize] = useState('0.02');
  const [slDist, setSlDist] = useState('10');
  const [tpDist, setTpDist] = useState('8');
  const [dailyLoss, setDailyLoss] = useState('2000');
  const [profitLockTarget, setProfitLockTarget] = useState('50');
  const [maxTrades, setMaxTrades] = useState('5');
  const [entryDistance, setEntryDistance] = useState('2.0');
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(true);
  const [trailingDistance, setTrailingDistance] = useState('1.5');
  const [maxConsSL, setMaxConsSL] = useState('6');
  const [cooldown, setCooldown] = useState('20');
  const [maxSpread, setMaxSpread] = useState('27');
  const [newsFilterEnabled, setNewsFilterEnabled] = useState(true);
  const [newsMinsBefore, setNewsMinsBefore] = useState('30');
  const [newsMinsAfter, setNewsMinsAfter] = useState('30');


  const [isResettingDailyLoss, setIsResettingDailyLoss] = useState(false);
  const [isResettingConsSL, setIsResettingConsSL] = useState(false);
  const [isResettingCooldown, setIsResettingCooldown] = useState(false);
  const [showDailyLossConfirm, setShowDailyLossConfirm] = useState(false);

  const safety = botState?.signalDetails?.daraSafety || (botState as any)?.daraTelemetry?.safety;
  const isDailyLossHit = safety?.isDailyLossHit || false;
  const isMaxConsecutiveSLHit = safety?.isMaxConsecutiveSLHit || false;
  const isInCooldown = safety?.isInCooldown || false;

  const handleResetDailyLoss = async () => {
    setIsResettingDailyLoss(true);
    const res = await (botApi as any).resetDailyLossLimit();
    setIsResettingDailyLoss(false);
    setShowDailyLossConfirm(false);
    if (res.success) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      if (onSaveSuccess) onSaveSuccess();
    } else {
      setErrorMsg(res.error || 'Failed to reset Daily Loss Limit');
    }
  };

  const handleResetConsSL = async () => {
    setIsResettingConsSL(true);
    const res = await (botApi as any).resetConsecutiveSL();
    setIsResettingConsSL(false);
    if (res.success) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      if (onSaveSuccess) onSaveSuccess();
    } else {
      setErrorMsg(res.error || 'Failed to reset Consecutive SL');
    }
  };

  const handleResetCooldown = async () => {
    setIsResettingCooldown(true);
    const res = await (botApi as any).resetCooldown();
    setIsResettingCooldown(false);
    if (res.success) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      if (onSaveSuccess) onSaveSuccess();
    } else {
      setErrorMsg(res.error || 'Failed to reset Cooldown');
    }
  };

  const hasInitialized = useRef(false);

  // Load initial from botState
  useEffect(() => {
    if (isOpen) {
      if (botState?.riskConfig && !hasInitialized.current) {
        if (botState.riskConfig.lotSize !== undefined) setLotSize(String(botState.riskConfig.lotSize));
        if (botState.riskConfig.slDistance !== undefined) setSlDist(String(botState.riskConfig.slDistance));
        else if (botState.riskConfig.stopLossPips !== undefined) setSlDist(String(botState.riskConfig.stopLossPips));
        if (botState.riskConfig.tpDistance !== undefined) setTpDist(String(botState.riskConfig.tpDistance));
        else if (botState.riskConfig.takeProfitPips !== undefined) setTpDist(String(botState.riskConfig.takeProfitPips));
        if (botState.riskConfig.maxDailyLossAmount !== undefined) setDailyLoss(String(botState.riskConfig.maxDailyLossAmount));
        else if (botState.riskConfig.maxDailyLoss !== undefined) setDailyLoss(String(botState.riskConfig.maxDailyLoss));
        if (botState.riskConfig.profitLockTarget !== undefined) setProfitLockTarget(String(botState.riskConfig.profitLockTarget));
        if (botState.riskConfig.maxOpenTrades !== undefined) setMaxTrades(String(botState.riskConfig.maxOpenTrades));
        if ((botState.riskConfig as any).entryDistance !== undefined) setEntryDistance(String((botState.riskConfig as any).entryDistance));
        if (botState.riskConfig.trailingStopEnabled !== undefined) setTrailingStopEnabled(Boolean(botState.riskConfig.trailingStopEnabled));
        if (botState.riskConfig.trailingDistance !== undefined) setTrailingDistance(String(botState.riskConfig.trailingDistance));
        if (botState.riskConfig.maxConsecutiveLosses !== undefined) setMaxConsSL(String(botState.riskConfig.maxConsecutiveLosses));
        if (botState.riskConfig.cooldownMinutes !== undefined) setCooldown(String(botState.riskConfig.cooldownMinutes));
        if (botState.riskConfig.maxSpreadPoints !== undefined) setMaxSpread(String(botState.riskConfig.maxSpreadPoints));
        if (botState.riskConfig.newsFilterEnabled !== undefined) setNewsFilterEnabled(Boolean(botState.riskConfig.newsFilterEnabled));
        if (botState.riskConfig.minutesBeforeNewsBlock !== undefined) setNewsMinsBefore(String(botState.riskConfig.minutesBeforeNewsBlock));
        if (botState.riskConfig.minutesAfterNewsBlock !== undefined) setNewsMinsAfter(String(botState.riskConfig.minutesAfterNewsBlock));
        setSuccessMsg(false);
        setErrorMsg('');
        hasInitialized.current = true;
      }
    } else {
      hasInitialized.current = false;
    }
  }, [isOpen, botState]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg(false);

    try {
      const parsedLot = Number(lotSize);
      const parsedSl = Number(slDist);
      const parsedTp = Number(tpDist);
      const parsedDailyLoss = Number(dailyLoss);
      const parsedProfitLock = Math.max(1, Number(profitLockTarget) || 50);
      const parsedTrades = Math.max(1, Math.min(5, Math.floor(Number(maxTrades) || 5)));
      const parsedEntryDist = Number(entryDistance);
      const parsedTrailDist = Number(trailingDistance);
      const parsedConsSl = Number(maxConsSL);
      const parsedCooldown = Number(cooldown);
      const parsedSpread = Number(maxSpread);
      const parsedNewsBefore = Number(newsMinsBefore);
      const parsedNewsAfter = Number(newsMinsAfter);

      if (isNaN(parsedLot) || parsedLot <= 0) throw new Error('Lot size មិនត្រឹមត្រូវ (ត្រូវធំជាង 0)');
      if (isNaN(parsedSl) || parsedSl <= 0) throw new Error('Stop Loss (Price Distance) មិនត្រឹមត្រូវ (ត្រូវធំជាង 0)');
      if (isNaN(parsedTp) || parsedTp <= 0) throw new Error('Take Profit (Price Distance) មិនត្រឹមត្រូវ (ត្រូវធំជាង 0)');

      await botApi.updateRiskConfig({
        lotSize: parsedLot,
        slDistance: parsedSl,
        stopLossPips: parsedSl,
        tpDistance: parsedTp,
        takeProfitPips: parsedTp,
        maxDailyLossAmount: parsedDailyLoss,
        maxDailyLoss: parsedDailyLoss,
        profitLockTarget: parsedProfitLock,
        maxOpenTrades: parsedTrades,
        entryDistance: isNaN(parsedEntryDist) || parsedEntryDist <= 0 ? 2.0 : parsedEntryDist,
        trailingStopEnabled: Boolean(trailingStopEnabled),
        trailingDistance: isNaN(parsedTrailDist) || parsedTrailDist <= 0 ? 1.5 : parsedTrailDist,
        trailingRule: 'Auto at Original TP (1.5 Price Distance)',
        maxConsecutiveLosses: parsedConsSl,
        cooldownMinutes: parsedCooldown,
        maxSpreadPoints: parsedSpread,
        newsFilterEnabled: Boolean(newsFilterEnabled),
        minutesBeforeNewsBlock: parsedNewsBefore,
        minutesAfterNewsBlock: parsedNewsAfter,
        liveTradingEnabled: isLiveEnabled,
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

          {/* LIVE TRADING CONTROL */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
              <Shield size={64} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isLiveEnabled ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-slate-600'}`}></div>
                <h3 className="text-sm font-bold text-white uppercase">LIVE TRADING / ការជួញដូរលុយពិត</h3>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 relative z-10">
                {isLiveEnabled 
                  ? '⚠️ គ្រោះថ្នាក់ (DANGER): Bot នឹងបាញ់ Order ទៅកាន់ទីផ្សារពិត (REAL MONEY EXECUTION ACTIVE)។' 
                  : 'សុវត្ថិភាព (SAFE): Bot ត្រឹមតែវិភាគ មិនបាញ់ Order លុយពិតទេ។'}
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleToggleClick}
              disabled={isChangingLive}
              className={`relative z-10 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${
                isLiveEnabled 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                  : 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 hover:from-red-500 hover:to-red-600 hover:text-white border border-red-500/50'
              }`}
            >
              {isChangingLive ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isLiveEnabled ? 'TURNING OFF...' : 'TURNING ON...'}</span>
                </>
              ) : isLiveEnabled ? (
                'TURN OFF LIVE'
              ) : (
                'ENABLE LIVE TRADING'
              )}
            </button>
          </div>

          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <Shield className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-amber-200/90 leading-relaxed">
              <strong>User Controlled Configuration:</strong> រាល់តម្លៃដែលអ្នកបញ្ចូលទីនេះ នឹងត្រូវបាន Save និងប្រើប្រាស់ដោយផ្ទាល់ពី EA ។ EA នឹងមិនមានការ Override ដោយ Backend ឡើយ។
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* LOT SIZE */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Lot Size / ទំហំ Lot</label>
              <input 
                type="number" step="0.01" min="0.01" max="200.00"
                value={lotSize} onChange={(e) => setLotSize(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* POSITIONS PER SETUP (1-5) */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Positions Per Setup (1–5) / ចំនួន Position ក្នុងមួយ Setup (1–5)</label>
              <input 
                type="number" step="1" min="1" max="5"
                value={maxTrades} onChange={(e) => setMaxTrades(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* ENTRY DISTANCE POS #1 */}
            <div className="bg-slate-800/30 border border-blue-900/40 bg-blue-950/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-blue-300 font-semibold">Entry Pullback Pos #1 / ចម្ងាយ Pullback ចូល Pos #1</label>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Entry 1</span>
              </div>
              <input 
                type="number" step="0.1" min="0.1"
                value={entryDistance} onChange={(e) => setEntryDistance(e.target.value)}
                placeholder="2.0"
                className="w-full bg-slate-900 border border-blue-600/50 focus:border-blue-400 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">រង់ចាំតម្លៃ Pullback ថយក្រោយ {entryDistance || '2.0'} ទើបបើក Trade Pos #1</p>
            </div>

            {/* SL DISTANCE */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Stop Loss (Price Distance) / ចម្ងាយកាត់ខាតតម្លៃផ្ទាល់</label>
              <input 
                type="number" step="any" min="0.01"
                value={slDist} onChange={(e) => setSlDist(e.target.value)}
                placeholder="10"
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* TP DISTANCE */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Take Profit (Price Distance) / ចម្ងាយយកចំណេញតម្លៃផ្ទាល់</label>
              <input 
                type="number" step="any" min="0.01"
                value={tpDist} onChange={(e) => setTpDist(e.target.value)}
                placeholder="8"
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* PROFIT LOCK TARGET */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Profit Lock Target (USC) / គោលដៅចាក់សោចំណេញ</label>
              <input 
                type="number" step="5" min="1"
                value={profitLockTarget} onChange={(e) => setProfitLockTarget(e.target.value)}
                placeholder="50"
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">ចាក់សោចំណេញពេល Basket កើនដល់ +{profitLockTarget || '50'} USC (True Net Profit)</p>
            </div>

            {/* DAILY LOSS LIMIT */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Daily Loss Limit (USC) / ដែនកំណត់ខាតប្រចាំថ្ងៃ</label>
              <div className="flex gap-2">
                <input 
                  type="number" step="10" min="0"
                  value={dailyLoss} onChange={(e) => setDailyLoss(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                />
                <button
                  onClick={(e) => { e.preventDefault(); setShowDailyLossConfirm(true); }}
                  disabled={!isDailyLossHit || isResettingDailyLoss}
                  className={`px-3 rounded-lg text-[11px] font-semibold tracking-wide uppercase transition-colors flex items-center gap-1 ${
                    isDailyLossHit
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isResettingDailyLoss ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  Reset
                </button>
              </div>
            </div>

            {/* MAX CONSECUTIVE SL */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Max Consecutive SL / ខាតជាប់គ្នាអតិបរមា</label>
              <div className="flex gap-2">
                <input 
                  type="number" step="1" min="1"
                  value={maxConsSL} onChange={(e) => setMaxConsSL(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                />
                <button
                  onClick={(e) => { e.preventDefault(); handleResetConsSL(); }}
                  disabled={!isMaxConsecutiveSLHit || isResettingConsSL}
                  className={`px-3 rounded-lg text-[11px] font-semibold tracking-wide uppercase transition-colors flex items-center gap-1 ${
                    isMaxConsecutiveSLHit
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isResettingConsSL ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  Reset
                </button>
              </div>
            </div>

            {/* MAX SPREAD */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Max Spread (Points) / គម្លាតទីផ្សារអតិបរមា</label>
              <input 
                type="number" step="1" min="1"
                value={maxSpread} onChange={(e) => setMaxSpread(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>

            {/* COOLDOWN */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Cooldown After SL (Minutes) / ផ្អាកបន្ទាប់ពីខាត (20 នាទី)</label>
              <div className="flex gap-2">
                <input 
                  type="number" step="1" min="0"
                  value={cooldown} onChange={(e) => setCooldown(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                />
                <button
                  onClick={(e) => { e.preventDefault(); handleResetCooldown(); }}
                  disabled={!isInCooldown || isResettingCooldown}
                  className={`px-3 rounded-lg text-[11px] font-semibold tracking-wide uppercase transition-colors flex items-center gap-1 ${
                    isInCooldown
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isResettingCooldown ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  Reset
                </button>
              </div>
            </div>

          </div>

          {/* TRAILING PROFIT SETTINGS SECTION */}
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Trailing Profit Settings (ការកំណត់ Trailing យកចំណេញ)</h3>
                <p className="text-xs text-slate-400">បើកដំណើរការ Trailing Stop Loss ដោយស្វ័យប្រវត្តិនៅពេលតម្លៃដល់ TP ដើម</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={trailingStopEnabled} 
                  onChange={(e) => setTrailingStopEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {trailingStopEnabled && (
              <div className="pt-2 border-t border-slate-800/60">
                <label className="block text-xs text-slate-400 mb-1">Trailing Distance (Raw Price) / ចម្ងាយ Trailing តាមតម្លៃ</label>
                <input 
                  type="number" step="0.1" min="0.1"
                  value={trailingDistance} onChange={(e) => setTrailingDistance(e.target.value)}
                  placeholder="1.5"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">រក្សាគម្លាតសុវត្ថិភាព {trailingDistance || '1.5'} ពីក្រោយតម្លៃ (SL រំកិលទៅមុខជានិច្ច មិនថយក្រោយឡើយ)</p>
              </div>
            )}
          </div>

          {/* NEWS FILTER SETTINGS SECTION */}
          <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">News Filter Settings (ការកំណត់តម្រងព័ត៌មាន)</h3>
                <p className="text-xs text-slate-400">ផ្អាកបើក Trade ស្វ័យប្រវត្តិកំឡុងពេលព័ត៌មានធំ (High-Impact USD/Gold News)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newsFilterEnabled} 
                  onChange={(e) => setNewsFilterEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {newsFilterEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Minutes Before News / នាទីផ្អាកមុនព័ត៌មានចេញ</label>
                  <input 
                    type="number" step="1" min="0"
                    value={newsMinsBefore} onChange={(e) => setNewsMinsBefore(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Minutes After News / នាទីផ្អាកក្រោយព័ត៌មានចេញ</label>
                  <input 
                    type="number" step="1" min="0"
                    value={newsMinsAfter} onChange={(e) => setNewsMinsAfter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}
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
            Cancel / បោះបង់
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
            Save Configuration / រក្សាទុក
          </button>
        </div>
      </div>

      
      {/* DAILY LOSS CONFIRM MODAL */}
      {showDailyLossConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/20 rounded-full flex-shrink-0">
                  <AlertCircle size={24} className="text-red-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Reset Daily Loss Limit?</h2>
              </div>
              <p className="text-sm text-slate-400 pl-[52px]">
                Daily Loss Limit has been reached.<br/>
                Reset protection and resume scanning?
              </p>
            </div>
            <div className="p-4 border-t border-slate-800/60 bg-slate-800/20 flex justify-end gap-3">
              <button 
                onClick={() => setShowDailyLossConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={handleResetDailyLoss}
                disabled={isResettingDailyLoss}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2"
              >
                {isResettingDailyLoss ? <Loader2 size={16} className="animate-spin" /> : null}
                RESET
              </button>
            </div>
          </div>
        </div>
      )}

      <LiveTradingConfirmModal
        isOpen={isLiveModalOpen}
        action={liveModalAction}
        isSubmitting={isChangingLive}
        onConfirm={handleConfirmLive}
        onClose={handleCloseLive}
        errorMessage={liveErrorMessage}
        loginId={botState.account?.loginId}
        lotSize={botState.riskConfig?.lotSize || 0.01}
      />
    </div>
  );
}
