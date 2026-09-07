import React, { useState, useEffect, useRef } from 'react';
import { Settings, ShieldAlert, FileText, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import { BotState } from '../types';
import { botApi } from '../services/api';

interface RiskSettingsPanelProps {
  botState: BotState;
  onRefresh?: () => void;
}

export function RiskSettingsPanel({ botState, onRefresh }: RiskSettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsExpanded(true);
    window.addEventListener('open_settings', handleOpen);
    
  const activeTrade = botState?.openTrades?.[0];
  const activeSide = activeTrade?.side || botState?.signalDetails?.side || '';
  const activeEntry = activeTrade?.entryPrice || botState?.signalDetails?.entry || 0;
  const activeSL = activeTrade?.sl || botState?.signalDetails?.sl || 0;
  const activeTP = activeTrade?.tp || botState?.signalDetails?.tp || 0;
  const activeRR = (activeEntry && activeSL && activeTP) 
    ? (Math.abs(activeTP - activeEntry) / Math.abs(activeEntry - activeSL))
    : 0;

  return () => window.removeEventListener('open_settings', handleOpen);
  }, []);

  // Form state initialized from botState.riskConfig
  const [lotSizeMode, setLotSizeMode] = useState<'fixed' | 'risk_percent'>(
    botState?.riskConfig?.lotSizeMode || 'fixed'
  );
  const [lotSize, setLotSize] = useState<string>(
    String(botState?.riskConfig?.lotSize ?? '0.01')
  );
  const [slPips, setSlPips] = useState<string>(String(botState?.riskConfig?.stopLossPips || 100));
  const [tpPips, setTpPips] = useState<string>(String(botState?.riskConfig?.takeProfitPips || 80));
  const [riskPerTrade, setRiskPerTrade] = useState<string>(
    String(botState?.riskConfig?.riskPercent ?? '1.0')
  );
  const [entryDistance, setEntryDistance] = useState<string>(String((botState?.riskConfig as any)?.entryDistance ?? 2.0));
  const [entriesPerSignal, setEntriesPerSignal] = useState<string>(
    "5"
  );
  const [maxOpenTrades, setMaxOpenTrades] = useState<string>(
    "5"
  );
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(botState?.riskConfig?.trailingStopEnabled ?? true);

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Sync state if botState updates from server (unless user is currently editing)
  useEffect(() => {
    if (isDirtyRef.current) return;

    if (botState?.riskConfig) {
      if (botState.riskConfig.lotSizeMode) {
        setLotSizeMode(botState.riskConfig.lotSizeMode);
      }
      if (botState.riskConfig.lotSize !== undefined) {
        setLotSize(String(botState.riskConfig.lotSize));
      }
      if (botState.riskConfig.riskPercent !== undefined) {
        setRiskPerTrade(String(botState.riskConfig.riskPercent));
      }
      if ((botState.riskConfig as any).entryDistance !== undefined) {
        setEntryDistance(String((botState.riskConfig as any).entryDistance));
      }
      if (botState.riskConfig.entriesPerSignal !== undefined) {
        setEntriesPerSignal(String(botState.riskConfig.entriesPerSignal));
      }
      if (botState.riskConfig.maxOpenTrades !== undefined) {
        setMaxOpenTrades(String(botState.riskConfig.maxOpenTrades));
      }
      if (botState.riskConfig.trailingStopEnabled !== undefined) {
        setTrailingStopEnabled(botState.riskConfig.trailingStopEnabled);
      }
    }
  }, [
    botState?.riskConfig?.lotSize,
    botState?.riskConfig?.lotSizeMode,
    botState?.riskConfig?.riskPercent,
    (botState?.riskConfig as any)?.entryDistance,
    botState?.riskConfig?.entriesPerSignal,
    botState?.riskConfig?.maxOpenTrades,
    botState?.riskConfig?.trailingStopEnabled,
  ]);

  // Preview calculations
  const balance = botState?.account?.balance || 0;
  const currency = botState?.account?.currency || 'USC';
  const parsedRiskPercent = parseFloat(riskPerTrade) || 1.0;
  const parsedSlPips = parseFloat(slPips) || 10;
  const parsedTpPips = parseFloat(tpPips) || 10;
  const parsedEntries = Math.max(1, parseInt(entriesPerSignal) || 1);
  const parsedMaxOpen = Math.max(1, parseInt(maxOpenTrades) || 4);

  // Calculate lot based on active mode
  let effectiveLotSize = 0.01;
  let calculatedRiskAmount = 0;

  if (lotSizeMode === 'risk_percent') {
    calculatedRiskAmount = (balance * parsedRiskPercent) / 100;
    const pipValuePerLot = 10;
    const rawLot = calculatedRiskAmount / (parsedSlPips * pipValuePerLot);
    effectiveLotSize = Math.max(0.01, Math.min(10.0, Number((rawLot || 0.01).toFixed(2))));
  } else {
    // Fixed lot mode
    const parsed = parseFloat(lotSize);
    effectiveLotSize = (!isNaN(parsed) && parsed > 0) ? Number(parsed.toFixed(2)) : 0.01;
    calculatedRiskAmount = effectiveLotSize * parsedSlPips * 10;
  }

  const totalLots = Number((effectiveLotSize * parsedEntries).toFixed(2));
  const maxPortfolioLots = Number((effectiveLotSize * parsedMaxOpen).toFixed(2));

  const handleResetToCurrent = () => {
    if (botState?.riskConfig) {
      if (botState.riskConfig.lotSizeMode) setLotSizeMode(botState.riskConfig.lotSizeMode);
            if (botState.riskConfig.lotSize !== undefined) setLotSize(String(botState.riskConfig.lotSize));
      if (botState.riskConfig.stopLossPips !== undefined) setSlPips(String(botState.riskConfig.stopLossPips));
      if (botState.riskConfig.takeProfitPips !== undefined) setTpPips(String(botState.riskConfig.takeProfitPips));
      if (botState.riskConfig.riskPercent !== undefined) setRiskPerTrade(String(botState.riskConfig.riskPercent));
      if (botState.riskConfig.entriesPerSignal !== undefined) setEntriesPerSignal(String(botState.riskConfig.entriesPerSignal));
      if (botState.riskConfig.maxOpenTrades !== undefined) setMaxOpenTrades(String(botState.riskConfig.maxOpenTrades));

      if (botState.riskConfig.trailingStopEnabled !== undefined) setTrailingStopEnabled(botState.riskConfig.trailingStopEnabled);

    }
    setIsDirty(false);
    setErrorMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const parsedLot = parseFloat(lotSize);
      const cleanLotSize = (!isNaN(parsedLot) && parsedLot > 0) ? Number(parsedLot.toFixed(2)) : 0.01;

      await botApi.updateRiskConfig({
        lotSizeMode: 'fixed',
        lotSize: cleanLotSize,
        riskPercent: parsedRiskPercent,
        entryDistance: Number(entryDistance) || 2.0,
        entriesPerSignal: parsedEntries,
        maxOpenTrades: parsedMaxOpen,
        stopLossPips: parsedSlPips,
        slDistance: parsedSlPips,
        takeProfitPips: parsedTpPips,
        tpDistance: parsedTpPips,
        trailingStopEnabled: Boolean(trailingStopEnabled),
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

  const activeTrade = botState?.openTrades?.[0];
  const activeSide = activeTrade?.side || botState?.signalDetails?.side || '';
  const activeEntry = activeTrade?.entryPrice || botState?.signalDetails?.entry || 0;
  const activeSL = activeTrade?.sl || botState?.signalDetails?.sl || 0;
  const activeTP = activeTrade?.tp || botState?.signalDetails?.tp || 0;
  const activeRR = (activeEntry && activeSL && activeTP) 
    ? (Math.abs(activeTP - activeEntry) / Math.abs(activeEntry - activeSL))
    : 0;

  return (
    <div id="risk-settings-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 mt-4 shadow-xl">
      <button 
        id="toggle-risk-settings-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Settings className="text-amber-400 w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                LOT SIZE & ENTRY SETTINGS
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                lotSizeMode === 'fixed' 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              }`}>
                {lotSizeMode === 'fixed' ? `FIXED ${effectiveLotSize} LOT` : `RISK ${parsedRiskPercent}%`}
              </span>
            </div>
            <p className="text-xs text-slate-400">កំណត់ទំហំ Lot Size, Sl, Tp និងចំនួន Trade ជាក់ស្តែងសម្រាប់ MT5 Order</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 size={14} /> Saved!
            </span>
          )}
          {isExpanded ? <ChevronUp className="text-slate-400 w-5 h-5" /> : <ChevronDown className="text-slate-400 w-5 h-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5 border-t border-slate-800/80 pt-5">
          
          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Mode Selection Tabs */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-1.5 flex gap-1">
              <button
                id="mode-fixed-lot-btn"
                type="button"
                onClick={() => setLotSizeMode('fixed')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  lotSizeMode === 'fixed'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Sliders size={14} />
                <span>Fixed Lot Mode (Strict 0.01)</span>
              </button>
              <button
                id="mode-risk-percent-btn"
                type="button"
                onClick={() => setLotSizeMode('risk_percent')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  lotSizeMode === 'risk_percent'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Sparkles size={14} />
                <span>Risk % Mode (Auto-Calculated)</span>
              </button>
            </div>

            {/* Mode Explanation Banner */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              lotSizeMode === 'fixed'
                ? 'bg-amber-500/5 border-amber-500/20 text-amber-300/90'
                : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300/90'
            }`}>
              {lotSizeMode === 'fixed' ? (
                <div>
                  <span className="font-bold text-amber-400">🔒 Fixed Lot Mode (Default & Recommended):</span> រាល់ Order ទាំងអស់ដែល Bot បាញ់ទៅ MT5 នឹងប្រើប្រាស់ទំហំ Lot ជាក់ស្តែងដែលអ្នកកំណត់ខាងក្រោម ({lotSize} Lot) ដោយមិនផ្លាស់ប្តូរតាម Balance ឡើយ។
                </div>
              ) : (
                <div>
                  <span className="font-bold text-indigo-400">⚡ Risk % Mode:</span> Bot នឹងគណនាទំហំ Lot Size ដោយស្វ័យប្រវត្តិតាមភាគរយហានិភ័យ ({parsedRiskPercent}%) ធៀបនឹង Balance ({balance.toLocaleString()} {currency}) និង Stop Loss ({parsedSlPips} Pips)។
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Lot Size Input (Active in Fixed Mode) */}
              <div className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                lotSizeMode === 'fixed'
                  ? 'bg-slate-950 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    Fixed Lot Size (Lot / Entry):
                  </span>
                  <div className="flex items-center gap-1">
                    {['0.01', '0.10', '0.50', '1.00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setLotSize(preset);
                          setLotSizeMode('fixed');
                        }}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                          lotSize === preset && lotSizeMode === 'fixed'
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <input 
                  id="input-lot-size"
                  type="number" 
                  step="0.01"
                  min="0.01"
                  max="200.00"
                  value={lotSize} 
                  onChange={(e) => setLotSize(e.target.value)}
                  className="bg-slate-900 border border-slate-700 focus:border-amber-500 text-white rounded-lg px-3 py-2 text-sm font-mono font-bold text-right focus:outline-none"
                  placeholder="0.01"
                />
              </div>

              {/* Risk Per Trade Input */}
              <div className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                lotSizeMode === 'risk_percent'
                  ? 'bg-slate-950 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-300 font-semibold">Risk Per Trade (%):</span>
                  <div className="flex items-center gap-1">
                    {['0.5', '1.0', '2.0'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setRiskPerTrade(preset);
                          setLotSizeMode('risk_percent');
                        }}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                          riskPerTrade === preset && lotSizeMode === 'risk_percent'
                            ? 'bg-indigo-600 text-white font-bold border-indigo-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>
                <input 
                  id="input-risk-percent"
                  type="number" 
                  step="0.1"
                  min="0.1"
                  max="10.0"
                  value={riskPerTrade} 
                  onChange={(e) => setRiskPerTrade(e.target.value)}
                  className="bg-slate-900 border border-slate-700 focus:border-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-mono font-bold text-right focus:outline-none"
                  placeholder="1.0"
                />
              </div>

              {/* Entries Per Signal */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    Entries Per Signal
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">M1 5-LEVEL</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">ចំនួន Order ចូលក្នុង 1 Signal (Max 5)</div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={entriesPerSignal}
                  onChange={(e) => setEntriesPerSignal(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-20 text-center font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Entry Pullback Pos #1 Distance */}
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-xs font-semibold">Entry Pullback Pos #1 (Raw Price)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Distance for Pos #1 (e.g. 2.0)</div>
                </div>
                <input 
                  id="input-entry-distance"
                  type="number" 
                  step="0.1"
                  min="0.1"
                  max="50.0"
                  value={entryDistance} 
                  onChange={(e) => setEntryDistance(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-20 text-right font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Maximum Open Trades */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    Max Open Trades
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">GLOBAL MAX</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">ចំនួន Trade បើកអតិបរមា (Global Max)</div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxOpenTrades}
                  onChange={(e) => setMaxOpenTrades(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-20 text-center font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-300 font-medium">Stop Loss (Price Distance):</div>
                  <div className="text-[10px] text-slate-500">ចម្ងាយតម្លៃផ្ទាល់ពី Entry (ឧទាហរណ៍ 10 = Entry ± 10)</div>
                </div>
                <input 
                  type="number" 
                  min="0.01"
                  step="any"
                  value={slPips} 
                  onChange={(e) => setSlPips(e.target.value)}
                  placeholder="10"
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-24 text-right font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-300 font-medium">Take Profit (Price Distance):</div>
                  <div className="text-[10px] text-slate-500">ចម្ងាយតម្លៃផ្ទាល់ពី Entry (ឧទាហរណ៍ 10 = Entry ± 10)</div>
                </div>
                <input 
                  type="number" 
                  min="0.01"
                  step="any"
                  value={tpPips} 
                  onChange={(e) => setTpPips(e.target.value)}
                  placeholder="10"
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-24 text-right font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              

            </div>
            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button 
                id="save-risk-settings-btn"
                type="button"
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>{isSaving ? 'កំពុងរក្សាទុក... (SAVING...)' : 'រក្សាទុកការកំណត់ LOT SIZE (SAVE SETTINGS)'}</span>
              </button>
              
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>MT5 Order នឹងប្រើប្រាស់ទំហំ <strong className="text-white font-mono">{effectiveLotSize} Lot</strong> ដោយផ្ទាល់</span>
              </div>
            </div>
          </div>

          {/* Trade Plan Preview */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
              <ShieldAlert size={100} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="text-amber-400 w-4 h-4" />
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">LIVE TRADE PLAN PREVIEW</h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                  {lotSizeMode.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Account Balance:</span>
                  <span className="font-mono text-white font-bold">
                    {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                
                

                <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Lot Size per Entry:</span>
                  <span className="font-mono text-emerald-400 font-black text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {effectiveLotSize.toFixed(2)} Lot
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Entries per Signal:</span>
                  <span className="font-mono text-white font-bold">{parsedEntries} Order</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Single Signal Volume:</span>
                  <span className="font-mono text-white font-bold">{totalLots.toFixed(2)} Lot</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5 bg-slate-900/80 p-2 rounded-lg -mx-1">
                  <span className="text-slate-300 font-medium">Max Portfolio Exposure:</span>
                  <span className="font-mono text-amber-400 font-black">{maxPortfolioLots.toFixed(2)} Lot ({parsedMaxOpen} max trades)</span>
                </div>

                
              </div>
            </div>

            
             <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">DaRa SETTINGS</h4>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">AUTO CALC</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                   <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-0.5">SIDE</span>
                      <span className={`font-mono font-bold ${activeSide === 'BUY' ? 'text-emerald-400' : activeSide === 'SELL' ? 'text-rose-400' : 'text-slate-400'}`}>{activeSide || 'WAITING'}</span>
                   </div>
                   <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-0.5">ENTRY</span>
                      <span className="font-mono text-white font-bold">{activeEntry ? activeEntry.toFixed(2) : '---'}</span>
                   </div>
                   <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-0.5">SL</span>
                      <span className="font-mono text-rose-400 font-bold">{activeSL ? activeSL.toFixed(2) : '---'}</span>
                   </div>
                   <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-0.5">TP</span>
                      <span className="font-mono text-emerald-400 font-bold">{activeTP ? activeTP.toFixed(2) : '---'}</span>
                   </div>
                </div>
                <div className="mt-2 bg-slate-900/50 p-2 rounded border border-slate-800 flex justify-between items-center">
                   <span className="text-slate-500 text-[10px]">R:R (Risk:Reward)</span>
                   <span className="font-mono text-amber-400 font-bold text-xs">{activeRR ? activeRR.toFixed(2) : '---'}</span>
                </div>
             </div>


          </div>

        </div>
      )}
    </div>
  );
}
