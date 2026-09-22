import React, { useState, useEffect, useRef } from 'react';
import { BotState, TradeOrder } from '../types';
import { botApi } from '../services/api';
import {
  Activity,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Search,
  Copy,
  Check,
  Zap,
  Database,
  Eye,
  Wifi,
  Layers,
  Sparkles,
  Target,
  Circle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

interface DaRaSetupViewProps {
  state: BotState;
}

interface LogEntry {
  time: string;
  msg: string;
  type: 'Setup' | 'Entry' | 'Safety' | 'Trade' | 'System';
  level: 'info' | 'success' | 'warn' | 'error';
}

export const DaRaSetupView: React.FC<DaRaSetupViewProps> = ({ state }) => {
  // Live Trading Status
  const isLiveEnabled = Boolean(state.riskConfig?.liveTradingEnabled || (state as any).daraTelemetry?.settings?.liveTradingEnabled);

  // 1. Telemetry & State Extraction
  const signalDetails = state.signalDetails;
  const telemetry = (state as any).daraTelemetry || signalDetails?.daraTelemetry;
  const setup = signalDetails?.daraSetup || telemetry?.setup;
  const analysis = telemetry?.analysis || signalDetails?.daraAnalysis;
  const safety = telemetry?.safety || signalDetails?.daraSafety;
  const daraState = telemetry?.state || signalDetails?.daraState || 'IDLE';
  const lastClosedTrade = telemetry?.lastClosedTrade || (state as any).lastClosedTrade;

  const activeTrade = state.openTrades?.find((t: TradeOrder) => t.isBotTrade || t.magicNumber === 778899 || t.magicNumber === 999111);

  const userSettings = telemetry?.settings || (state.riskConfig as any) || {};
  const currentSpread = (state as any).spread || (state as any).spreadPoints || 0;
  const maxSpread = userSettings.maxSpreadPoints || 27;
  const dailyLossLimit = userSettings.dailyLossLimit || 50;
  const dailyLossCurrent = telemetry?.dailyLossAccumulated ?? ((state as any).dailyLoss || 0);
  const maxTrades = Math.max(1, Math.min(5, Math.floor(userSettings.maxOpenTrades || 5)));
  const openTradesCount = state.openTrades?.length || 0;
  const isNewsBlocked = safety?.isNewsBlocked ?? Boolean((state?.account as any)?.newsBlockedStatus);
  const isMt5Connected = Boolean(state?.account?.serverConnected || state?.account?.isConnected);
  
  // 1.1 Intent-Based Status Calculation
  const desiredRunning = state.desiredBotState === 'RUNNING';
  const isPriceFresh = Boolean(state.startConfirmation?.isPriceFresh);
  const isEaRunning = Boolean(state.startConfirmation?.eaRunning);
  
  const isRunning = desiredRunning; // Intent is running
  const isInitialStartup = desiredRunning && !state.lastTickTime;
  const isBotReconnecting = desiredRunning && !isMt5Connected;

  // 2. Exact Safety Guard Evaluation (Bilingual Khmer & English)
  const safetyGuards = [
    {
      id: 'bot_status',
      nameKh: 'ស្ថានភាព Bot',
      nameEn: 'Bot Status',
      passed: desiredRunning,
      detailKh: !desiredRunning ? 'បានបញ្ឈប់ដោយអ្នកប្រើ (Stopped)' : isInitialStartup ? 'កំពុងចាប់ផ្តើម (Starting...)' : isBotReconnecting ? 'កំពុងភ្ជាប់ឡើងវិញ (Reconnecting...)' : 'ដំណើរការ ២៤/៧ (Running 24/7)',
      detailEn: !desiredRunning ? 'Stopped by User' : isInitialStartup ? 'Starting...' : isBotReconnecting ? 'Reconnecting...' : 'Running 24/7',
      critical: true
    },
    {
      id: 'mt5_connection',
      nameKh: 'ការភ្ជាប់ MT5',
      nameEn: 'MT5 Connection',
      passed: isMt5Connected,
      detailKh: isMt5Connected ? 'បានភ្ជាប់ (CONNECTED)' : 'ដាច់ការភ្ជាប់ (DISCONNECTED)',
      detailEn: isMt5Connected ? 'CONNECTED' : 'DISCONNECTED',
      critical: true
    },
    {
      id: 'market_data',
      nameKh: 'ទិន្នន័យទីផ្សារ',
      nameEn: 'Market Data',
      passed: isPriceFresh,
      detailKh: isPriceFresh ? 'ផ្សាយផ្ទាល់ (LIVE)' : 'រអាក់រអួល (STALE)',
      detailEn: isPriceFresh ? 'LIVE' : 'STALE',
      critical: true
    },
    {
      id: 'spread_guard',
      nameKh: 'ដែនកំណត់ Spread',
      nameEn: 'Spread Guard',
      passed: currentSpread <= maxSpread,
      detailKh: currentSpread <= maxSpread 
        ? `Spread ${currentSpread} ≤ កំណត់ ${maxSpread} pts` 
        : `Spread ${currentSpread} > កំណត់ ${maxSpread} pts (លើស)`,
      detailEn: currentSpread <= maxSpread 
        ? `Spread ${currentSpread} ≤ Max ${maxSpread} pts` 
        : `Spread ${currentSpread} > Max ${maxSpread} pts`,
      critical: true
    },
    {
      id: 'daily_loss',
      nameKh: 'កំណត់ខាតប្រចាំថ្ងៃ',
      nameEn: 'Daily Loss Limit',
      passed: !safety?.isDailyLossHit && dailyLossCurrent < dailyLossLimit,
      detailKh: `ខាត ${dailyLossCurrent.toFixed(2)} / កំណត់ ${dailyLossLimit.toFixed(2)}`,
      detailEn: `Loss ${dailyLossCurrent.toFixed(2)} / Limit ${dailyLossLimit.toFixed(2)}`,
      critical: true
    },
    {
      id: 'max_trades',
      nameKh: 'ចំនួន Trade អតិបរមា',
      nameEn: 'Max Open Trades',
      passed: openTradesCount < maxTrades,
      detailKh: `សកម្ម: ${openTradesCount} / កំណត់: ${maxTrades}`,
      detailEn: `Active: ${openTradesCount} / Max: ${maxTrades}`,
      critical: false
    },
    {
      id: 'news_filter',
      nameKh: 'តម្រងព័ត៌មាន',
      nameEn: 'News Filter',
      passed: !isNewsBlocked,
      detailKh: !isNewsBlocked ? 'ទីផ្សារសុវត្ថិភាព (គ្មានព័ត៌មានធំ)' : 'ពេលព័ត៌មានជះឥទ្ធិពលខ្លាំង',
      detailEn: !isNewsBlocked ? 'Market Safe' : 'High Impact News Window',
      critical: false
    },
    {
      id: 'duplicate_protection',
      nameKh: 'ការពារ Trade ជាន់គ្នា',
      nameEn: 'Duplicate Guard',
      passed: openTradesCount === 0,
      detailKh: openTradesCount === 0 ? 'ទំនេរអាចបើកបាន (Clear)' : 'មាន Trade កំពុងដើរ (Active)',
      detailEn: openTradesCount === 0 ? 'Clear (No Duplicate)' : 'Active Trade Running',
      critical: false
    }
  ];

  // Derive overall blocked status & reason (Bilingual Khmer & English)
  const isEntryBlocked = !isRunning || !isMt5Connected || currentSpread > maxSpread || dailyLossCurrent >= dailyLossLimit || openTradesCount >= maxTrades || isNewsBlocked;
  let blockedReason = safety?.blockedReason;
  if (!blockedReason) {
    if (!isRunning) blockedReason = 'Bot ត្រូវបានបញ្ឈប់ដោយអ្នកប្រើប្រាស់ • EA Engine Stopped by User';
    else if (!isMt5Connected) blockedReason = 'ដាច់ការភ្ជាប់ MT5 Server • MT5 Server Disconnected';
    else if (currentSpread > maxSpread) blockedReason = `Spread លើសកំណត់ (${currentSpread} > ${maxSpread} pts) • Spread Exceeds Limit`;
    else if (dailyLossCurrent >= dailyLossLimit) blockedReason = `ដល់កំណត់ខាតប្រចាំថ្ងៃ (${dailyLossCurrent.toFixed(2)} >= ${dailyLossLimit.toFixed(2)}) • Daily Loss Hit`;
    else if (openTradesCount >= maxTrades) blockedReason = `ដល់កំណត់ចំនួន Position ក្នុងមួយ Setup (${openTradesCount}/${maxTrades}) • Max Positions Per Setup Reached`;
    else if (isNewsBlocked) blockedReason = 'ស្ថិតក្នុងម៉ោងព័ត៌មានសេដ្ឋកិច្ចធំ (High Impact News Window Active)';
  }

  // 3. Setup Flow Step (1 to 10 - Strict Fast Market Entry Flow)
  let currentStep = 1;
  if (!isRunning) {
    currentStep = 0; // IDLE
  } else if (daraState === 'TRADE_CLOSED' || (setup?.status === 'EXECUTED' && !activeTrade && daraState !== 'TRADE_ACTIVE')) {
    currentStep = 10;
  } else if (activeTrade) {
    currentStep = 9;
  } else if (daraState === 'EXECUTING') {
    currentStep = 8; // SAFETY CHECK is part of execution phase
  } else if (daraState === 'ENTRY_REACHED' || setup?.status === 'ENTRY_REACHED') {
    currentStep = 7;
  } else if (daraState === 'WAIT_FOR_LOCKED_ENTRY') {
    currentStep = 6;
  } else if (daraState === 'LOCK_ENTRY' || setup?.lockedEntryPrice) {
    currentStep = 5;
  } else if (daraState === 'MSS_CONFIRMED' || setup?.mssLevel || analysis?.mss?.buy === 'CONFIRMED' || analysis?.mss?.sell === 'CONFIRMED') {
    currentStep = 4;
  } else if (setup?.displacementConfirmed || analysis?.displacement?.buy === 'CONFIRMED' || analysis?.displacement?.sell === 'CONFIRMED') {
    currentStep = 3;
  } else if ((setup?.sweepLevel && setup.sweepLevel > 0) || analysis?.liquiditySweep?.buy === 'DETECTED' || analysis?.liquiditySweep?.sell === 'DETECTED') {
    currentStep = 2;
  } else {
    currentStep = 1;
  }

  // 4. Setup Flow Step Definitions (10 Disciplined Steps Flow - Bilingual Khmer & English)
  const stepDefinitions = [
    { num: 1, name: 'M1 MARKET SCAN', titleKh: 'ស្កេន M1', shortDescKh: 'ស្កេន M1', shortDescEn: 'Market Scan', descKh: 'ស្កេនទៀន M1 ២៤/៧', descEn: '24/7 M1 Market Scanning' },
    { num: 2, name: 'M1 LIQUIDITY SWEEP', titleKh: 'Liquidity Sweep', shortDescKh: 'បោស H/L', shortDescEn: 'Liq Sweep', descKh: 'Wick ហួស M1 Swing', descEn: 'Wick beyond recent M1 Swing' },
    { num: 3, name: 'M1 DISPLACEMENT', titleKh: 'Displacement', shortDescKh: 'ទៀនធំ', shortDescEn: 'Displacement', descKh: 'ទៀនធ្លាក់/ឡើងខ្លាំង', descEn: 'Impulsive directional displacement' },
    { num: 4, name: 'M1 MSS CONFIRMED', titleKh: 'MSS Confirmed', shortDescKh: 'បញ្ជាក់ MSS', shortDescEn: 'MSS Confirm', descKh: 'Market Structure Shift', descEn: 'Market Structure Shift Confirmed' },
    { num: 5, name: 'LOCK ENTRY', titleKh: 'Lock Entry', shortDescKh: 'Lock Entry', shortDescEn: 'Lock Entry', descKh: 'គណនាទីតាំង Entry', descEn: 'Calculate Locked Entry Price' },
    { num: 6, name: 'WAIT FOR ENTRY', titleKh: 'Wait For Entry', shortDescKh: 'Wait Entry', shortDescEn: 'Wait Entry', descKh: 'រង់ចាំតម្លៃថយក្រោយ', descEn: 'Wait for retracement' },
    { num: 7, name: 'ENTRY REACHED', titleKh: 'Entry Reached', shortDescKh: 'Entry Reached', shortDescEn: 'Entry Reached', descKh: 'តម្លៃដល់ទីតាំង', descEn: 'Price reached Entry level' },
    { num: 8, name: 'SAFETY CHECK', titleKh: 'Safety Check', shortDescKh: 'ឆែកសុវត្ថិភាព', shortDescEn: 'Safety Check', descKh: 'ត្រួតពិនិត្យសុវត្ថិភាព', descEn: 'Safety guards verification' },
    { num: 9, name: 'TRADE ACTIVE', titleKh: 'Trade Active', shortDescKh: 'Trade Active', shortDescEn: 'Trade Active', descKh: 'Position ដំណើរការ', descEn: 'Trade position active' },
    { num: 10, name: 'TRADE CLOSED', titleKh: 'Trade Closed', shortDescKh: 'Trade Closed', shortDescEn: 'Trade Closed', descKh: 'Trade បានបញ្ចប់', descEn: 'Trade execution completed' }
  ];

  // 5. Activity Logs State
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      time: new Date().toLocaleTimeString('en-GB'),
      msg: '[DaRa M1 EA v1.0] ENGINE RUNNING — ដំណើរការស្កេន M1 ២៤/៧ (24/7 Scanner Active)',
      type: 'System',
      level: 'info'
    },
    {
      time: new Date().toLocaleTimeString('en-GB'),
      msg: `[DaRa M1 EA v1.0] តាមដានទីផ្សារ M1 លើ Exness XAUUSDc USC (M1 Market Scanning Active)`,
      type: 'Setup',
      level: 'info'
    }
  ]);
  const [filter, setFilter] = useState<'ALL' | 'Setup' | 'Entry' | 'Safety' | 'Trade' | 'System'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // References for detecting genuine state transitions
  const prevStepRef = useRef(currentStep);
  const prevSetupIdRef = useRef(setup?.id);
  const prevBlockedRef = useRef(isEntryBlocked);
  const prevActiveTradeRef = useRef(Boolean(activeTrade));
  const prevAnomalyRef = useRef(false);

  useEffect(() => {
    const time = new Date().toLocaleTimeString('en-GB');

    const addLog = (msg: string, type: LogEntry['type'], level: LogEntry['level'] = 'info') => {
      setLogs(prev => [{ time, msg, type, level }, ...prev].slice(0, 150));
    };

    // Anomaly detection
    if (setup?.isAnomaly && !prevAnomalyRef.current) {
      addLog(`[DaRa M1 EA v1.0] 🚨 POSITION LIMIT ANOMALY DETECTED: Broker reports positions exceeding user limit. NEW ENTRIES BLOCKED.`, 'System', 'error');
      prevAnomalyRef.current = true;
    } else if (!setup?.isAnomaly) {
      prevAnomalyRef.current = false;
    }

    // Step change logs
    if (currentStep !== prevStepRef.current) {
      const stepInfo = stepDefinitions.find(s => s.num === currentStep);
      if (stepInfo) {
        addLog(`[DaRa M1 EA v1.0] ជំហានទី ${stepInfo.num}: ${stepInfo.titleKh} (${stepInfo.name}) — ${stepInfo.descKh}`, 'Setup', 'info');
      }
      prevStepRef.current = currentStep;
    }

    // New setup detected
    if (setup && setup.id !== prevSetupIdRef.current) {
      addLog(`[DaRa M1 EA v1.0] បានប្រទះឃើញ SETUP ថ្មី (${setup.direction}): Sweep=${setup.sweepLevel?.toFixed(3)} | MSS=${setup.mssLevel?.toFixed(3)} | Fast Market Entry`, 'Setup', 'success');
      prevSetupIdRef.current = setup.id;
    }

    // Safety status change
    if (isEntryBlocked !== prevBlockedRef.current) {
      if (isEntryBlocked) {
        addLog(`[DaRa M1 EA v1.0] 🔴 ប្រព័ន្ធសុវត្ថិភាពរារាំង (Safety Guard Active): ${blockedReason}`, 'Safety', 'warn');
      } else {
        addLog(`[DaRa M1 EA v1.0] 🟢 សុវត្ថិភាពឆ្លងកាត់ទាំងអស់ — អនុញ្ញាតឱ្យចូល Order (All Safety Guards Passed)`, 'Safety', 'success');
      }
      prevBlockedRef.current = isEntryBlocked;
    }

    // Active Trade change
    const hasActiveTrade = Boolean(activeTrade);
    if (hasActiveTrade !== prevActiveTradeRef.current) {
      if (hasActiveTrade) {
        addLog(`[DaRa M1 EA v1.0] បានបើក TRADE ថ្មី: #{activeTrade?.ticket || 'LIVE'} | {activeTrade?.side} {activeTrade?.lot} Lots @ {activeTrade?.entryPrice?.toFixed(3)}`, 'Trade', 'success');
      } else {
        addLog(`[DaRa M1 EA v1.0] TRADE បានបិទបញ្ចប់ — កំណត់ត្រឡប់មកជំហានទី ០១ ស្កេន M1 បន្ត (Reset to Scanning)`, 'Trade', 'info');
      }
      prevActiveTradeRef.current = hasActiveTrade;
    }
  }, [currentStep, setup?.id, isEntryBlocked, blockedReason, activeTrade]);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[{l.time}] [{l.type.toUpperCase()}] {l.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter(l => {
    const matchesFilter = filter === 'ALL' || l.type === filter;
    const matchesSearch = searchQuery === '' || l.msg.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const currentRefTime = (state as any).serverTimeMs || Date.now();
  const lastTickAgeSeconds = state.lastTickTime ? Math.max(0, (currentRefTime - state.lastTickTime) / 1000).toFixed(1) : '---' ;

  return (
    <div id="dara-m1-monitor" className="font-sans max-w-[1400px] mx-auto p-3 md:p-6 space-y-6 bg-[#05080F] min-h-screen text-slate-100">

      {/* ========================================================================= */}
      {/* SECTION 1: MAIN ENGINE & MARKET TELEMETRY BANNER (BILINGUAL)               */}
      {/* ========================================================================= */}
      <div id="dara-telemetry-header" className="bg-[#0B101A] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col xl:flex-row flex-wrap justify-between items-start xl:items-center gap-4 sm:gap-6">
          
          {/* Left: Engine Identity & Pulse */}
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 w-full xl:w-auto">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner shrink-0 transition-colors ${
              isRunning ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}>
              <Activity className={`w-6 h-6 ${isRunning ? 'animate-pulse' : ''}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-white tracking-wide whitespace-nowrap shrink-0">
                  DaRa M1 EA v1.0
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/70 px-2.5 py-1 rounded-lg border border-cyan-500/30 whitespace-nowrap">
                  M1 SWEEP ➔ DISPLACEMENT ➔ MSS
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-amber-950/70 border border-amber-500/40 text-amber-300 whitespace-nowrap">
                  REAL USC CENT (គណនី Cent)
                </span>
                
                {isLiveEnabled ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-red-950/80 border border-red-500/60 text-red-400 whitespace-nowrap shadow-[0_0_12px_rgba(239,68,68,0.2)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    LIVE TRADING ACTIVE (លុយពិត)
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-slate-800/90 border border-slate-700 text-slate-300 whitespace-nowrap">
                    READ-ONLY MONITOR (ផ្ទាំងតាមដាន)
                  </span>
                )}

              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
                ប្រព័ន្ធជួញដូរមាស M1 DaRa ស្វ័យប្រវត្ត • Autonomous DaRa Execution Cycle for Gold (XAUUSDc) • Exness MT5
              </p>
            </div>
          </div>

          {/* Right: Engine Status Badge */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full xl:w-auto justify-start xl:justify-end">
            <div className={`px-4 py-2 rounded-xl border font-mono text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm whitespace-nowrap transition-colors ${
              !desiredRunning 
                ? 'bg-rose-950/40 border-rose-600/40 text-rose-400' 
                : (isInitialStartup || isBotReconnecting)
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : isEntryBlocked 
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' 
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                !desiredRunning 
                  ? 'bg-rose-500' 
                  : (isInitialStartup || isBotReconnecting)
                    ? 'bg-amber-500 animate-pulse'
                    : isEntryBlocked 
                      ? 'bg-amber-400 animate-ping' 
                      : 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
              }`}></span>
              <span>
                {!desiredRunning 
                  ? 'ម៉ាស៊ីន: បានបញ្ឈប់ (BOT STOPPED)' 
                  : isInitialStartup
                    ? 'ម៉ាស៊ីន: កំពុងចាប់ផ្តើម (BOT STARTING...)'
                    : isBotReconnecting
                      ? 'ម៉ាស៊ីន: កំពុងភ្ជាប់ឡើងវិញ (BOT RUNNING / RECONNECTING)'
                      : isEntryBlocked 
                        ? 'ម៉ាស៊ីន: ដំណើរការ (BOT RUNNING - ENTRY BLOCKED)' 
                        : 'ម៉ាស៊ីន: កំពុងដំណើរការ (BOT RUNNING)'}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/90 px-4 py-2 rounded-xl font-mono text-xs sm:text-sm flex items-center gap-2 text-slate-300 whitespace-nowrap">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>អាយុកាល Tick (Tick Age):</span>
              <span className="font-bold text-white font-mono">{lastTickAgeSeconds}s</span>
            </div>
          </div>
        </div>

        {/* Telemetry Strip: MT5 Connection, Price, M1 Data (Bilingual) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          
          {/* Card 1: MT5 Connection */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-medium mb-1.5">
              <Wifi className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>ការភ្ជាប់ MT5</span>
              <span className="text-[10px] text-slate-500 font-mono">(Connection)</span>
            </div>
            <div className={`text-xs sm:text-sm font-bold font-mono flex items-center gap-2 ${isMt5Connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${isMt5Connected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`}></span>
              <span>{isMt5Connected ? 'ភ្ជាប់ (CONNECTED)' : 'ដាច់ការភ្ជាប់ (DISCONNECTED)'}</span>
            </div>
          </div>

          {/* Card 2: Market Data */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-medium mb-1.5">
              <Zap className={`w-4 h-4 shrink-0 ${isPriceFresh ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>ទិន្នន័យទីផ្សារ (Market Data)</span>
            </div>
            <div className={`text-xs sm:text-sm font-bold font-mono flex items-center gap-2 ${isPriceFresh ? 'text-amber-300' : 'text-rose-400'}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${isPriceFresh ? 'bg-amber-400 animate-ping' : 'bg-rose-500'}`}></span>
              <span>{isPriceFresh ? 'ផ្សាយផ្ទាល់ (LIVE)' : 'រអាក់រអួល (STALE)'}</span>
            </div>
          </div>

          {/* Card 3: Bid Price */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1.5">
              តម្លៃទិញចូល (Bid Price)
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
              {state.bidPrice ? state.bidPrice.toString() : state.goldPrice ? state.goldPrice.toString() : '---'}
            </div>
          </div>

          {/* Card 4: Ask Price */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1.5">
              តម្លៃលក់ចេញ (Ask Price)
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
              {state.askPrice ? state.askPrice.toString() : '---'}
            </div>
          </div>

          {/* Card 5: Live Spread */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1.5">
              គម្លាតតម្លៃផ្ទាល់ (Spread)
            </div>
            <div className={`text-xs sm:text-sm font-bold font-mono flex items-baseline gap-2 flex-wrap ${currentSpread <= maxSpread ? 'text-amber-400' : 'text-rose-400'}`}>
              <span className="text-base sm:text-lg font-bold">{typeof state.spreadPoints === 'number' && state.spreadPoints > 0 ? state.spreadPoints : '--'}</span>
            </div>
          </div>

          {/* Card 6: M1 Candles */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-medium mb-1.5">
              <Database className="w-4 h-4 text-purple-400 shrink-0" />
              <span>ទៀន M1 (Candles)</span>
            </div>
            <div className="text-xs sm:text-sm font-bold font-mono text-purple-300">
              {analysis?.candlesCount ? `${analysis.candlesCount} Bars (សកម្ម/Active)` : 'កំពុងទទួល...'}
            </div>
          </div>

        </div>

        {/* Live M1 Candle Breakdown */}
        {analysis?.currentCandle && (
          <div className={`mt-3 p-3 bg-slate-950/80 border ${isPriceFresh ? 'border-slate-800/70' : 'border-rose-900/50'} rounded-xl text-xs font-mono flex flex-wrap items-center justify-between gap-2.5 ${isPriceFresh ? 'text-slate-300' : 'text-slate-500'}`}>
            <span className={`uppercase text-[11px] tracking-wider font-sans font-bold flex items-center gap-1.5 ${isPriceFresh ? 'text-slate-400' : 'text-rose-400'}`}>
              <Eye className={`w-3.5 h-3.5 shrink-0 ${isPriceFresh ? 'text-cyan-400' : 'text-rose-500'}`} />
              {isPriceFresh ? 'ទៀន M1 កំពុងរត់ (Active M1 Candle):' : 'ទៀន M1 បង្កក (STALE M1 CANDLE):'}
            </span>
            <div className={`flex flex-wrap items-center gap-3 sm:gap-4 text-xs ${isPriceFresh ? '' : 'opacity-50 grayscale'}`}>
              <span>O: <span className={state.account?.marketDataReceiving ? "text-white font-bold" : ""}>{analysis.currentCandle.open.toString()}</span></span>
              <span>H: <span className={state.account?.marketDataReceiving ? "text-emerald-400 font-bold" : ""}>{analysis.currentCandle.high.toString()}</span></span>
              <span>L: <span className={state.account?.marketDataReceiving ? "text-rose-400 font-bold" : ""}>{analysis.currentCandle.low.toString()}</span></span>
              <span>C: <span className={state.account?.marketDataReceiving ? "text-cyan-300 font-bold" : ""}>{analysis.currentCandle.close.toString()}</span></span>
            </div>
            {analysis.previousCandle && (
              <div className={`text-[11px] ${state.account?.marketDataReceiving ? 'text-slate-400' : 'text-slate-600'}`}>
                បិទទៀនមុន (Prev Close): <span className={state.account?.marketDataReceiving ? "text-slate-200 font-bold" : ""}>{analysis.previousCandle.close.toString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: 🔥 DARA LIVE SETUP FLOW (10 DISCIPLINED STEPS - BILINGUAL)      */}
      {/* ========================================================================= */}
      <div id="dara-setup-flow" className="bg-[#0B101A] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              🔥 លំហូរប្រតិបត្តិការ DaRa ១០ ជំហាន (10 Steps Fast Market Execution Flow)
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              វដ្តប្រតិបត្តិការ M1 យ៉ាងម៉ត់ចត់ (Authoritative Flow): M1 MARKET SCAN → LIQUIDITY SWEEP → DISPLACEMENT → MSS CONFIRMED → LOCK ENTRY → WAIT FOR ENTRY → ENTRY REACHED → SAFETY CHECK → TRADE ACTIVE → TRADE CLOSED
            </p>
          </div>
          <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-cyan-400 whitespace-nowrap self-start sm:self-auto">
            បច្ចុប្បន្ន (CURRENT): ជំហាន {currentStep.toString().padStart(2, '0')}/10 ({stepDefinitions.find(s => s.num === currentStep)?.titleKh || 'IDLE'})
          </div>
        </div>

        {/* 10 Steps Grid / Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-10 gap-2 min-w-0">
          {stepDefinitions.map(step => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <div
                key={step.num}
                className={`relative p-2 sm:p-2.5 rounded-xl border transition-all duration-300 flex flex-col justify-between min-h-[148px] overflow-hidden min-w-0 ${
                  isActive
                    ? 'bg-blue-950/60 border-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.35)] ring-1 ring-blue-400/80'
                    : isCompleted
                      ? 'bg-emerald-950/20 border-emerald-600/40'
                      : 'bg-slate-900/40 border-slate-800/70 opacity-70'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-[0_0_8px_#3b82f6]'
                        : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isCompleted ? '✓' : step.num}
                    </span>
                    <span className={`text-[8.5px] font-mono font-bold uppercase tracking-tight px-1.5 py-0.5 rounded shrink-0 ${
                      isActive 
                        ? 'bg-blue-500/25 text-blue-300 border border-blue-400/40' 
                        : isCompleted 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                    }`}>
                      {isActive ? '● ACTIVE' : isCompleted ? '✓ DONE' : 'WAIT'}
                    </span>
                  </div>

                  <h4 className={`text-xs font-bold leading-tight break-words min-h-[30px] flex items-center ${
                    isActive ? 'text-white font-black' : isCompleted ? 'text-slate-200' : 'text-slate-300'
                  }`}>
                    {step.titleKh}
                  </h4>
                  <div className={`text-[9px] font-mono font-semibold tracking-tight uppercase break-words leading-tight mt-0.5 ${
                    isActive ? 'text-cyan-300 font-bold' : 'text-slate-400'
                  }`}>
                    {step.name}
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[9.5px] leading-tight space-y-0.5 min-w-0">
                  <div className={`break-words font-medium ${isActive ? 'text-slate-200' : 'text-slate-300'}`}>
                    {step.shortDescKh}
                  </div>
                  <div className="text-slate-500 font-mono text-[8.5px] break-words leading-tight">
                    {step.shortDescEn}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 🚨 ANOMALY ALERT PANEL                                                    */}
        {/* ========================================================================= */}
        {setup?.isAnomaly && (
          <div className="mt-4 bg-red-950/20 border border-red-500/40 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
            <div className="bg-red-500/20 p-2 rounded-xl text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-red-400 uppercase tracking-wider">POSITION LIMIT ANOMALY</h3>
              <p className="text-[11px] text-red-300 font-medium">Broker reports positions exceeding user limit. NEW ENTRIES BLOCKED. Existing positions are protected by broker SL/TP.</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🔥 AUTHORITATIVE PRECISION ENTRY GATE PANEL                               */}
        {/* ========================================================================= */}
        {setup?.precisionGate && (
          <div className="mt-4 bg-slate-900/60 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all">
            {/* Panel Header */}
            <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">PRECISION ENTRY GATE</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-900/60 text-cyan-200 border border-cyan-500/30">V1.0</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest text-[8px] sm:text-[10px]">PRECISION MODE: AUTHORITATIVE</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex flex-col items-end flex-1 sm:flex-none">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Precision Score</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black font-mono leading-none ${setup.precisionGate.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {setup.precisionGate.total}
                    </span>
                    <span className="text-slate-500 font-mono text-sm">/ {setup.precisionGate.max}</span>
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-xl border font-black text-[10px] sm:text-xs tracking-widest flex items-center gap-2.5 shadow-inner transition-all ${
                  setup.precisionGate.passed 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10' 
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-amber-500/5'
                }`}>
                  {(() => {
                    const pg = setup.precisionGate;
                    if (pg.passed) return <><CheckCircle2 className="w-4 h-4" /> PASS</>;
                    if (pg.details.isRetestConfirmed) return <><Target className="w-4 h-4" /> RETEST CONFIRMED</>;
                    if (pg.details.isRetestTouched) return <><Clock className="w-4 h-4 animate-spin-slow" /> WAITING M1 CONFIRMATION</>;
                    if (pg.total >= pg.threshold) return <><Search className="w-4 h-4" /> WAITING RETEST</>;
                    return <><Activity className="w-4 h-4" /> WAITING</>;
                  })()}
                </div>
              </div>
            </div>

            {/* Panel Body: Component Breakdown & Context */}
            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: 8 Scoring Components */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Component Analysis</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">REQUIRED: 11/12</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Liquidity Sweep', points: setup.precisionGate.components.sweep, max: 2 },
                    { label: 'Displacement', points: setup.precisionGate.components.displacement, max: 2 },
                    { label: 'MSS Confirmed', points: setup.precisionGate.components.mss, max: 2 },
                    { 
                      label: 'Retest + Rejection', 
                      points: setup.precisionGate.components.retest, 
                      max: 2,
                      isRetest: true
                    },
                    { label: 'EMA 9/21 Context', points: setup.precisionGate.components.emaContext, max: 1 },
                    { label: 'VWAP Context', points: setup.precisionGate.components.vwapContext, max: 1 },
                    { label: 'Candle Confirm', points: setup.precisionGate.components.candleConf, max: 1 },
                    { label: 'Session Quality', points: setup.precisionGate.components.sessionTime, max: 1 },
                  ].map((comp, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border flex flex-col justify-between min-h-[70px] transition-all ${
                      comp.points > 0 
                        ? 'bg-slate-800/40 border-cyan-500/30 ring-1 ring-cyan-500/10' 
                        : 'bg-slate-900/40 border-slate-800 opacity-60'
                    }`}>
                      <div className="flex items-start justify-between gap-1.5">
                        <span className={`text-[10px] font-bold leading-tight uppercase tracking-tight ${comp.points > 0 ? 'text-white' : 'text-slate-500'}`}>
                          {comp.label}
                        </span>
                        {comp.points > 0 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-mono text-slate-500">Weight: +{comp.max}</span>
                        <span className={`text-xs font-black font-mono ${comp.points > 0 ? 'text-cyan-300' : 'text-slate-600'}`}>
                          +{comp.points}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Retest Status & Live Context */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                
                {/* Retest Status Deep-Dive */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex-1">
                  <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Retest Status</div>
                  
                  <div className={`flex flex-col items-center justify-center py-4 px-2 rounded-lg border text-center transition-all ${
                    setup.precisionGate.details.isRetestConfirmed
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : setup.precisionGate.details.isRetestTouched
                        ? 'bg-amber-500/10 border-amber-500/30 animate-pulse'
                        : 'bg-slate-900/40 border-slate-800'
                  }`}>
                    <div className="mb-2">
                      {setup.precisionGate.details.isRetestConfirmed ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      ) : setup.precisionGate.details.isRetestTouched ? (
                        <Clock className="w-8 h-8 text-amber-400 mx-auto animate-spin-slow" />
                      ) : (
                        <Target className="w-8 h-8 text-slate-700 mx-auto" />
                      )}
                    </div>
                    
                    <h4 className={`text-xs font-black uppercase tracking-widest ${
                      setup.precisionGate.details.isRetestConfirmed ? 'text-emerald-400' :
                      setup.precisionGate.details.isRetestTouched ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {setup.precisionGate.details.isRetestConfirmed ? 'RETEST: CONFIRMED +2' :
                       setup.precisionGate.details.isRetestTouched ? 'RETEST: TOUCHED — WAITING M1' :
                       'RETEST: NOT TOUCHED'}
                    </h4>
                    
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      {setup.precisionGate.details.isRetestConfirmed 
                        ? 'ទៀន M1 បញ្ជាក់ការបដិសេធ (M1 Rejection Confirmed)' 
                        : setup.precisionGate.details.isRetestTouched 
                          ? 'រង់ចាំទៀន M1 បិទបញ្ជាក់ការបដិសេធ (Waiting for M1 Rejection Close)' 
                          : 'រង់ចាំតម្លៃត្រឡប់មកដល់ Locked Entry (Waiting for price to touch Locked Entry)'}
                    </p>
                  </div>
                </div>

                {/* Live Context Data */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Live Context</div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500">EMA 9 / 21:</span>
                      <span className="text-white">
                        {setup.precisionGate.details.ema9?.toFixed(3) || '---'} / {setup.precisionGate.details.ema21?.toFixed(3) || '---'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500">VWAP:</span>
                      <span className="text-white">{setup.precisionGate.details.vwap?.toFixed(3) || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500">Session:</span>
                      <span className="text-cyan-400 font-black">{setup.precisionGate.details.sessionName || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500">Live Spread:</span>
                      <span className={`font-black ${currentSpread <= maxSpread ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currentSpread} pts
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Current State Explanation Box (Bilingual) */}
        <div className="mt-4 p-4 bg-slate-950/90 border border-slate-800/90 rounded-xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shrink-0"></div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white uppercase font-mono mr-2">
              🔥 ស្ថានភាពបច្ចុប្បន្ន (CURRENT STATE): {stepDefinitions.find(s => s.num === currentStep)?.titleKh || 'SCANNING'} ({stepDefinitions.find(s => s.num === currentStep)?.name || 'SCANNING'})
            </span>
            {currentStep === 1 && '« DaRa កំពុងស្កេនទៀន M1 ២៤/៧ ស្វែងរក Liquidity Sweep លើ Swing High/Low • DaRa is actively scanning closed M1 candles 24/7 for Liquidity Sweep on Swing High/Low. »'}
            {currentStep === 2 && '« បានប្រទះឃើញ Liquidity Sweep លើ M1! កំពុងរង់ចាំទៀន Displacement • Liquidity Sweep detected on M1. Waiting for impulsive displacement candle. »'}
            {currentStep === 3 && '« ចលនា Displacement ត្រូវបានបញ្ជាក់! កំពុងរង់ចាំការបិទទៀន MSS • Displacement confirmed. Waiting for Market Structure Shift (MSS) candle closure. »'}
            {currentStep === 4 && '« MSS ត្រូវបានបញ្ជាក់ (MSS CONFIRMED) — Precision Gate → LOCK ENTRY • Market Structure Shift confirmed — Precision Gate → LOCK ENTRY »'}
            {currentStep === 5 && '« បានចាក់សោទីតាំង Entry (LOCK ENTRY)! គណនាគោលដៅ Grid ទាំង ៥ កម្រិតរួចរាល់ • Entry price locked. 5-level grid targets calculated. »'}
            {currentStep === 6 && '« កំពុងរង់ចាំតម្លៃទាញថយក្រោយ (WAIT FOR ENTRY)... • Waiting for price pullback to locked entry level... »'}
            {currentStep === 7 && '« តម្លៃបានមកដល់ទីតាំង Entry (ENTRY REACHED)! ត្រៀមត្រួតពិនិត្យសុវត្ថិភាព • Price reached locked entry level. Proceeding to Safety Check. »'}
            {currentStep === 8 && (isEntryBlocked 
              ? `« ការត្រួតពិនិត្យសុវត្ថិភាព (SAFETY CHECK)៖ រារាំងមិនទាន់ឱ្យចូល (${blockedReason}) • Safety Guard Active: Entry blocked. »` 
              : '« ការត្រួតពិនិត្យសុវត្ថិភាព (SAFETY CHECK)៖ ឆ្លងកាត់គ្រប់លក្ខខណ្ឌទាំងអស់ (SAFETY PASS)! • All safety guards passed! Ready for execution. »')}
            {currentStep === 9 && '« Trade កំពុងដំណើរការជាមួយសំបុត្រ #' + ((activeTrade as any)?.ticket || 'LIVE') + ' (Hard SL & TP ការពាររួចរាល់) • Trade active. Initial SL & TP established. »'}
            {currentStep === 10 && (lastClosedTrade 
              ? `« Trade #${lastClosedTrade.ticket} ត្រូវបានបិទបញ្ចប់ដោយ ${lastClosedTrade.exitReason} (${lastClosedTrade.pnl >= 0 ? '+' : ''}${lastClosedTrade.pnl.toFixed(2)})! កំណត់ប្រព័ន្ធឡើងវិញ → ត្រឡប់មកស្កេន M1 ថ្មី • Trade closed via ${lastClosedTrade.exitReason}. Resetting engine for next setup. »` 
              : '« Trade ត្រូវបានបិទបញ្ចប់! កំណត់ប្រព័ន្ធឡើងវិញ → ត្រឡប់មកស្កេន M1 ថ្មី • Trade closed. Resetting engine for next setup. »')}
          </div>
        </div>

        {/* Closed Trade Summary Card (when trade is closed or last closed trade is recorded) */}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: 🛡 SAFETY STATUS (BILINGUAL SAFETY GUARDS MATRIX)               */}
      {/* ========================================================================= */}
      <div className="w-full">
        {/* SECTION 3B: 🛡 SAFETY MATRIX (GUARDS WITH PASS / BLOCKED - BILINGUAL) */}
        <div id="dara-safety-matrix" className="bg-[#0B101A] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                🛡 ស្ថានភាពប្រព័ន្ធសុវត្ថិភាព (Safety Status - Guards Matrix)
              </h3>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                !isEntryBlocked 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-950 text-rose-400 border border-rose-500/30'
              }`}>
                {!isEntryBlocked ? '🟢 ឆ្លងកាត់ទាំងអស់ (ALL PASS)' : '🔴 ជាប់ការរារាំង (GUARD ACTIVE)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {safetyGuards.map(guard => (
                <div 
                  key={guard.id}
                  className={`p-3 rounded-xl border transition-colors flex flex-col justify-between min-h-[74px] ${
                    guard.passed 
                      ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80' 
                      : 'bg-rose-950/30 border-rose-600/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {guard.nameKh} <span className="text-[10px] text-slate-400 font-normal">({guard.nameEn})</span>
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                      guard.passed 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                    }`}>
                      {guard.passed ? '✓ ឆ្លងកាត់ (PASS)' : '✕ រារាំង (BLOCKED)'}
                    </span>
                  </div>
                  <div className={`text-[11px] font-mono truncate ${guard.passed ? 'text-slate-300' : 'text-rose-300 font-bold'}`}>
                    {guard.detailKh}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prominent Bottom Banner: ENTRY ALLOWED or ENTRY BLOCKED (Bilingual) */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            {!isEntryBlocked ? (
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                    🟢 អនុញ្ញាតឱ្យចូល ORDER — ប្រព័ន្ធសុវត្ថិភាពឆ្លងកាត់ទាំងអស់ (FAST ENTRY ALLOWED)
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    DaRa EA ទទួលបានការអនុញ្ញាតពេញលេញក្នុងការចូល Market Order ភ្លាមៗនៅពេល MSS Confirmed (Fast Market Entry) • Fully authorized to execute instant Market Order upon MSS Confirmed.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/50 rounded-xl flex items-center gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                    🔴 រារាំងមិនឱ្យចូល ORDER (ENTRY BLOCKED): {blockedReason || 'លក្ខខណ្ឌសុវត្ថិភាពមិនទាន់គ្រប់គ្រាន់'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    មិនអនុញ្ញាតឱ្យបើក Trade ថ្មីទេរហូតដល់លក្ខខណ្ឌទីផ្សារត្រឡប់មកប្រក្រតីវិញ • No new orders will be executed until market conditions normalize and all guards pass.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: 📜 LIVE EA ACTIVITY LOG (BILINGUAL AUDIT TRAIL)                */}
      {/* ========================================================================= */}
      <div id="dara-activity-log" className="bg-[#0B101A] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 mb-4 border-b border-slate-800/80">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            📜 កំណត់ត្រាសកម្មភាព EA ផ្ទាល់ (Live EA Activity Log - Real Audit Trail)
          </h3>
          
          {/* Filter Buttons (Bilingual) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'ALL (ទាំងអស់)' },
              { id: 'Setup', label: 'Setup (ការរៀបចំ)' },
              { id: 'Entry', label: 'Entry (ការចូលផ្សារ)' },
              { id: 'Safety', label: 'Safety (សុវត្ថិភាព)' },
              { id: 'Trade', label: 'Trade (ការជួញដូរ)' },
              { id: 'System', label: 'System (ប្រព័ន្ធ)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all ${
                  filter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar & Copy */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកកំណត់ត្រាសកម្មភាព... / Search activity log..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
            />
          </div>
          <button
            onClick={handleCopyLogs}
            className="px-3.5 py-2 rounded-xl border border-slate-800/90 bg-slate-900/90 text-slate-300 text-xs font-mono hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'បានចម្លង (Copied)' : 'ចម្លង (Copy)'}</span>
          </button>
        </div>

        {/* Log List */}
        <div className="bg-slate-950/90 border border-slate-900 rounded-xl p-3 sm:p-4 h-60 overflow-y-auto font-mono text-xs space-y-2 shadow-inner">
          {filteredLogs.map((log, index) => (
            <div key={index} className="flex items-start gap-2.5 hover:bg-slate-900/40 p-1.5 rounded-lg transition-colors">
              <span className="text-slate-400 text-[11px] shrink-0 font-normal">[{log.time}]</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wider ${
                log.type === 'Setup' ? 'bg-blue-950/80 text-blue-400 border border-blue-800/40' :
                log.type === 'Entry' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40' :
                log.type === 'Safety' ? 'bg-purple-950/80 text-purple-400 border border-purple-800/40' :
                log.type === 'Trade' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' :
                'bg-slate-900 text-slate-400 border border-slate-800'
              }`}>
                {log.type}
              </span>
              <span className={`leading-relaxed break-all ${
                log.level === 'error' ? 'text-rose-400 font-bold' :
                log.level === 'warn' ? 'text-amber-300' :
                log.level === 'success' ? 'text-emerald-300' :
                'text-slate-300'
              }`}>
                {log.msg}
              </span>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              មិនមានកំណត់ត្រាសកម្មភាពដែលត្រូវគ្នានឹងការស្វែងរកទេ (No matching activity logs found)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
