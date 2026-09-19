import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Plus, 
  Minus, 
  RotateCcw,
  Sliders,
  Zap,
  Activity
} from 'lucide-react';
import { BotState } from '../types';
import { botApi } from '../services/api';

interface ProtectionSettingsPanelProps {
  botState: BotState;
  onRefresh?: () => void;
}

export function ProtectionSettingsPanel({ botState, onRefresh }: ProtectionSettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsExpanded(true);
    window.addEventListener('open_settings', handleOpen);
    return () => window.removeEventListener('open_settings', handleOpen);
  }, []);

  // Form states synced from botState
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(
    String(botState?.riskConfig?.maxConsecutiveLosses ?? '3')
  );
  const [cooldownMinutes, setCooldownMinutes] = useState(
    String(botState?.riskConfig?.cooldownMinutes ?? '15')
  );
  const [maxDailyLossPercent, setMaxDailyLossPercent] = useState(
    String(botState?.riskConfig?.maxDailyLossPercent ?? '5')
  );
  const [maxDailyLossAmount, setMaxDailyLossAmount] = useState(
    String(botState?.riskConfig?.maxDailyLossAmount ?? '50')
  );
  
  const [startHour, setStartHour] = useState(
    botState?.tradingHours?.startHour ?? '08:00'
  );
  const [stopHour, setStopHour] = useState(
    botState?.tradingHours?.stopHour ?? '22:00'
  );

  // Sync state only when not actively edited by the user
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    if (isDirtyRef.current) return;

    if (botState?.riskConfig) {
      if (botState.riskConfig.maxConsecutiveLosses !== undefined) {
        setMaxConsecutiveLosses(String(botState.riskConfig.maxConsecutiveLosses));
      }
      if (botState.riskConfig.cooldownMinutes !== undefined) {
        setCooldownMinutes(String(botState.riskConfig.cooldownMinutes));
      }
      if (botState.riskConfig.maxDailyLossPercent !== undefined) {
        setMaxDailyLossPercent(String(botState.riskConfig.maxDailyLossPercent));
      }
      if (botState.riskConfig.maxDailyLossAmount !== undefined) {
        setMaxDailyLossAmount(String(botState.riskConfig.maxDailyLossAmount));
      }
    }
    if (botState?.tradingHours) {
      if (botState.tradingHours.startHour) setStartHour(botState.tradingHours.startHour);
      if (botState.tradingHours.stopHour) setStopHour(botState.tradingHours.stopHour);
    }
  }, [
    botState?.riskConfig?.maxConsecutiveLosses,
    botState?.riskConfig?.cooldownMinutes,
    botState?.riskConfig?.maxDailyLossPercent,
    botState?.riskConfig?.maxDailyLossAmount,
    botState?.tradingHours?.startHour,
    botState?.tradingHours?.stopHour
  ]);

  const handleResetToCurrent = () => {
    if (botState?.riskConfig) {
      setMaxConsecutiveLosses(String(botState.riskConfig.maxConsecutiveLosses ?? '3'));
      setCooldownMinutes(String(botState.riskConfig.cooldownMinutes ?? '15'));
      setMaxDailyLossPercent(String(botState.riskConfig.maxDailyLossPercent ?? '5'));
      setMaxDailyLossAmount(String(botState.riskConfig.maxDailyLossAmount ?? '50'));
    }
    if (botState?.tradingHours) {
      setStartHour(botState.tradingHours.startHour ?? '08:00');
      setStopHour(botState.tradingHours.stopHour ?? '22:00');
    }
    setIsDirty(false);
    setErrorMessage('');
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      await botApi.updateRiskConfig({
        maxConsecutiveLosses: Math.max(1, parseInt(maxConsecutiveLosses) || 3),
        cooldownMinutes: Math.max(1, parseInt(cooldownMinutes) || 15),
        maxDailyLossPercent: Math.max(0.1, parseFloat(maxDailyLossPercent) || 5),
        maxDailyLossAmount: Math.max(1, parseFloat(maxDailyLossAmount) || 50),
      });
      
      await botApi.saveSettings({
        riskConfig: {
          maxConsecutiveLosses: Math.max(1, parseInt(maxConsecutiveLosses) || 3),
          cooldownMinutes: Math.max(1, parseInt(cooldownMinutes) || 15),
          maxDailyLossPercent: Math.max(0.1, parseFloat(maxDailyLossPercent) || 5),
          maxDailyLossAmount: Math.max(1, parseFloat(maxDailyLossAmount) || 50),
        },
        tradingHours: {
          enabled: true,
          startHour,
          stopHour,
        }
      });

      setIsDirty(false);
      setSaveSuccess(true);
      if (onRefresh) onRefresh();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e: any) {
      setErrorMessage(e.message || 'បរាជ័យក្នុងការ Save');
    } finally {
      setIsSaving(false);
    }
  };

  const adjustConsecutiveLosses = (delta: number) => {
    setIsDirty(true);
    const curr = parseInt(maxConsecutiveLosses) || 3;
    const next = Math.max(1, Math.min(10, curr + delta));
    setMaxConsecutiveLosses(String(next));
  };

  const adjustCooldownMinutes = (delta: number) => {
    setIsDirty(true);
    const curr = parseInt(cooldownMinutes) || 15;
    const next = Math.max(1, Math.min(180, curr + delta));
    setCooldownMinutes(String(next));
  };

  const adjustDailyLossPercent = (delta: number) => {
    setIsDirty(true);
    const curr = parseFloat(maxDailyLossPercent) || 5;
    const next = Math.max(0.5, Math.min(50, Number((curr + delta).toFixed(1))));
    setMaxDailyLossPercent(String(next));
  };

  const adjustDailyLossAmount = (delta: number) => {
    setIsDirty(true);
    const curr = parseFloat(maxDailyLossAmount) || 50;
    const next = Math.max(5, Math.min(50000, curr + delta));
    setMaxDailyLossAmount(String(next));
  };

  return (
    <div id="protection-settings-panel" className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3 sm:p-4 mt-4 shadow-lg transition-all">
      {/* Header Accordion Button */}
      <button 
        id="toggle-protection-settings-btn"
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2.5 sm:gap-3.5 focus:outline-none cursor-pointer group text-left"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-rose-500/20 to-amber-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide truncate">
                AUTO RISK PROTECTION & SESSIONS
              </h2>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[9px] font-bold tracking-tight shrink-0">
                PRO ACTIVE
              </span>
              {isDirty && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shrink-0">
                  ● Unsaved
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate leading-tight">
              ការពារ SL ជាប់គ្នា, Cooldown សម្រាក, ដែនកំណត់ខាតប្រចាំថ្ងៃ & ម៉ោងជួញដូរ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveSuccess && (
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 shadow-sm animate-fade-in">
              <CheckCircle2 size={13} /> រួចរាល់
            </span>
          )}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-slate-700 transition-all">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-5 border-t border-slate-800/80 pt-6 space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Column 1: Loss & Drawdown Protection */}
            <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-4 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <AlertOctagon className="w-4 h-4" />
                  <span>ការការពារពេលប៉ះ SL ជាប់គ្នា (RAPID SL SHIELD)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">SAFETY GUARD</span>
              </div>
              
              <div className="space-y-3.5">
                {/* 1. Max Consecutive Losses */}
                <div className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Max Consecutive Losses (SL ជាប់គ្នា)</span>
                      <p className="text-[10px] text-slate-400">ចំនួនដង SL ជាប់គ្នា មុននឹងបញ្ឈប់ Bot ចូល Trade</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => adjustConsecutiveLosses(-1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                        title="បន្ថយ"
                      >
                        <Minus size={13} />
                      </button>
                      <input 
                        id="input-consecutive-losses"
                        type="number" 
                        min="1"
                        max="10"
                        value={maxConsecutiveLosses} 
                        onChange={e => {
                          setIsDirty(true);
                          setMaxConsecutiveLosses(e.target.value);
                        }} 
                        className="bg-transparent text-amber-400 text-sm font-bold w-10 text-center font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => adjustConsecutiveLosses(1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                        title="បន្ថែម"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  {/* Quick presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[9px] text-slate-500 uppercase font-semibold">Presets:</span>
                    {['2', '3', '4', '5'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          setMaxConsecutiveLosses(val);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-all cursor-pointer ${
                          maxConsecutiveLosses === val
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                        }`}
                      >
                        {val} ដង
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Cooldown Minutes */}
                <div className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Cooldown Minutes (សម្រាកទីផ្សារ)</span>
                      <p className="text-[10px] text-slate-400">រយៈពេលផ្អាកសម្រាកពេលប៉ះ SL គ្រប់កំណត់</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => adjustCooldownMinutes(-5)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                        title="បន្ថយ 5 នាទី"
                      >
                        <Minus size={13} />
                      </button>
                      <input 
                        id="input-cooldown-minutes"
                        type="number" 
                        min="1"
                        max="180"
                        value={cooldownMinutes} 
                        onChange={e => {
                          setIsDirty(true);
                          setCooldownMinutes(e.target.value);
                        }} 
                        className="bg-transparent text-indigo-300 text-sm font-bold w-12 text-center font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => adjustCooldownMinutes(5)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                        title="បន្ថែម 5 នាទី"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  {/* Quick presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[9px] text-slate-500 uppercase font-semibold">Presets:</span>
                    {['10', '15', '30', '60'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          setCooldownMinutes(val);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-all cursor-pointer ${
                          cooldownMinutes === val
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                        }`}
                      >
                        {val}mn
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Max Daily Loss % & Amount $ (Grid 2 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1">Max Daily Loss (%)</span>
                    <div className="flex items-center justify-between gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => adjustDailyLossPercent(-0.5)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-mono font-bold text-rose-400">{maxDailyLossPercent}%</span>
                      <button
                        type="button"
                        onClick={() => adjustDailyLossPercent(0.5)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1">Max Daily Loss ({(botState?.account?.currency || 'USC')})</span>
                    <div className="flex items-center justify-between gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => adjustDailyLossAmount(-50)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-mono font-bold text-rose-400">{maxDailyLossAmount} {(botState?.account?.currency || 'USC')}</span>
                      <button
                        type="button"
                        onClick={() => adjustDailyLossAmount(50)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Column 2: Trading Sessions & Environment Shield */}
            <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-4 shadow-inner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    <span>ម៉ោងជួញដូរស្វ័យប្រវត្តិ (TRADING SESSION)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> 🟢 24/7 AUTO
                  </span>
                </div>
                
                <div className="space-y-3.5 mt-3.5">
                  {/* 24/7 Auto Banner */}
                  <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-300">24/7 CONTINUOUS OPERATION</div>
                        <div className="text-[11px] text-slate-400">មិនបាច់កំណត់ម៉ោងជួញដូរ — EA វិភាគនិង Trade 24/7 ពេលទីផ្សារបើក</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                      {botState?.isMarketOpen !== false ? '🟢 MARKET OPEN' : '⏸️ MARKET CLOSED'}
                    </span>
                  </div>
                  
                  {/* Active Guard Info Card */}
                  <div className="bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span>AUTO SPREAD & HIGH VOLATILITY SHIELD</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        • ផ្អាកចូល Trade ថ្មីដោយស្វ័យប្រវត្តិពេល Spread &gt; 50 points ឬពេលមាន News ខ្លាំង 
                        {botState?.newsProviderStatus === 'CONNECTED' ? (
                          <span className="text-emerald-400 font-bold ml-1">(REAL NEWS DATA = CONNECTED)</span>
                        ) : (
                          <span className="text-rose-400 font-bold ml-1">(REAL NEWS DATA = UNAVAILABLE, NEW ENTRIES = BLOCKED)</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        • Auto Resume ដំណើរការវិញភ្លាមៗពេលទីផ្សារមានស្ថិរភាពធម្មតា
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Summary Chips */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-emerald-400" />
                  <span>Active Session: <strong className="text-slate-200 font-mono">24/7 AUTO</strong></span>
                </div>
                <div className="font-mono text-amber-400">Max SL: {maxConsecutiveLosses}x</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons Footer (Full Width & Balanced) */}
          <div className="pt-4 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleResetToCurrent}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer w-full sm:w-auto"
                >
                  <RotateCcw size={13} />
                  <span>ត្រឡប់តម្លៃដើម (Reset)</span>
                </button>
              )}
            </div>

            <button 
              id="save-protection-settings-btn"
              type="button"
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold px-8 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 w-full sm:w-auto disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{isSaving ? 'កំពុងរក្សាទុក... (SAVING...)' : 'រក្សាទុកការកំណត់ការពារ (SAVE PROTECTION)'}</span>
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
}

