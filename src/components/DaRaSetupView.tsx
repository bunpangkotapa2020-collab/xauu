import React, { useState, useEffect, useRef } from 'react';
import { BotState, TradeOrder } from '../types';
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
  Layers
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
  const currentSpread = state.spread || (state as any).spreadPoints || 0;
  const maxSpread = userSettings.maxSpreadPoints || 27;
  const dailyLossLimit = userSettings.dailyLossLimit || 50;
  const dailyLossCurrent = telemetry?.dailyLossAccumulated ?? (state.dailyLoss || 0);
  const maxTrades = userSettings.maxOpenTrades || 1;
  const openTradesCount = state.openTrades?.length || 0;
  const maxConsecutiveSL = userSettings.maxConsecutiveSL || 3;
  const consecutiveLosses = telemetry?.consecutiveLossCount ?? state.consecutiveLosses ?? 0;
  const isCooldown = safety?.isInCooldown ?? Boolean(state.cooldownUntil && Date.now() < state.cooldownUntil);
  const isNewsBlocked = safety?.isNewsBlocked ?? Boolean(state?.account?.newsBlockedStatus);
  const isMt5Connected = Boolean(state?.account?.serverConnected || state?.account?.isConnected);
  const isRunning = state.status === 'running' || state.desiredBotState === 'RUNNING';

  // 2. Exact 9 Safety Guard Evaluation (Bilingual Khmer & English)
  const safetyGuards = [
    {
      id: 'bot_status',
      nameKh: 'ស្ថានភាព Bot',
      nameEn: 'Bot Status',
      passed: isRunning,
      detailKh: isRunning ? 'ដំណើរការ ២៤/៧' : 'បានបញ្ឈប់ដោយអ្នកប្រើ',
      detailEn: isRunning ? 'Running 24/7' : 'Stopped by User',
      critical: true
    },
    {
      id: 'mt5_connection',
      nameKh: 'ការភ្ជាប់ MT5',
      nameEn: 'MT5 Connection',
      passed: isMt5Connected,
      detailKh: isMt5Connected ? 'បានភ្ជាប់ Server & Terminal' : 'ដាច់ការភ្ជាប់ MT5',
      detailEn: isMt5Connected ? 'Connected' : 'Disconnected',
      critical: true
    },
    {
      id: 'spread_guard',
      nameKh: 'ដែនកំណត់ Spread',
      nameEn: 'Spread Guard',
      passed: currentSpread <= maxSpread,
      detailKh: currentSpread <= maxSpread 
        ? `Spread {currentSpread} ≤ កំណត់ {maxSpread} pts` 
        : `Spread {currentSpread} > កំណត់ {maxSpread} pts (លើស)`,
      detailEn: currentSpread <= maxSpread 
        ? `Spread {currentSpread} ≤ Max {maxSpread} pts` 
        : `Spread {currentSpread} > Max {maxSpread} pts`,
      critical: true
    },
    {
      id: 'daily_loss',
      nameKh: 'កំណត់ខាតប្រចាំថ្ងៃ',
      nameEn: 'Daily Loss Limit',
      passed: !safety?.isDailyLossHit && dailyLossCurrent < dailyLossLimit,
      detailKh: `ខាត {dailyLossCurrent.toFixed(2)} / កំណត់ {dailyLossLimit.toFixed(2)}`,
      detailEn: `Loss {dailyLossCurrent.toFixed(2)} / Limit {dailyLossLimit.toFixed(2)}`,
      critical: true
    },
    {
      id: 'max_trades',
      nameKh: 'ចំនួន Trade អតិបរមា',
      nameEn: 'Max Open Trades',
      passed: openTradesCount < maxTrades,
      detailKh: `សកម្ម: {openTradesCount} / កំណត់: {maxTrades}`,
      detailEn: `Active: {openTradesCount} / Max: {maxTrades}`,
      critical: false
    },
    {
      id: 'consecutive_sl',
      nameKh: 'កំណត់ SL ជាប់គ្នា',
      nameEn: 'Max Consecutive SL',
      passed: consecutiveLosses < maxConsecutiveSL,
      detailKh: `SL ជាប់គ្នា: {consecutiveLosses} / កំណត់: {maxConsecutiveSL}`,
      detailEn: `Streak: {consecutiveLosses} / Max: {maxConsecutiveSL}`,
      critical: false
    },
    {
      id: 'cooldown',
      nameKh: 'សម្រាកក្រោយខាត',
      nameEn: 'Loss Cooldown',
      passed: !isCooldown,
      detailKh: !isCooldown ? 'គ្មាន Cooldown (ប្រក្រតី)' : 'កំពុងសម្រាកក្រោយ SL',
      detailEn: !isCooldown ? 'No Cooldown' : 'Cooldown Active',
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
  const isEntryBlocked = !isRunning || !isMt5Connected || currentSpread > maxSpread || dailyLossCurrent >= dailyLossLimit || openTradesCount >= maxTrades || consecutiveLosses >= maxConsecutiveSL || isCooldown || isNewsBlocked;
  let blockedReason = safety?.blockedReason;
  if (!blockedReason) {
    if (!isRunning) blockedReason = 'Bot ត្រូវបានបញ្ឈប់ដោយអ្នកប្រើប្រាស់ • EA Engine Stopped by User';
    else if (!isMt5Connected) blockedReason = 'ដាច់ការភ្ជាប់ MT5 Server • MT5 Server Disconnected';
    else if (currentSpread > maxSpread) blockedReason = `Spread លើសកំណត់ ({currentSpread} > {maxSpread} pts) • Spread Exceeds Limit`;
    else if (dailyLossCurrent >= dailyLossLimit) blockedReason = `ដល់កំណត់ខាតប្រចាំថ្ងៃ ({dailyLossCurrent.toFixed(2)} >= {dailyLossLimit.toFixed(2)}) • Daily Loss Hit`;
    else if (openTradesCount >= maxTrades) blockedReason = `ដល់កំណត់ចំនួន Trade អតិបរមា ({openTradesCount}/{maxTrades}) • Max Open Trades Reached`;
    else if (consecutiveLosses >= maxConsecutiveSL) blockedReason = `ដល់កំណត់ SL ជាប់គ្នា ({consecutiveLosses}/{maxConsecutiveSL}) • Max Consecutive SL Reached`;
    else if (isCooldown) blockedReason = 'កំពុងសម្រាកក្រោយ SL (Loss Cooldown Active) • Loss Cooldown in Effect';
    else if (isNewsBlocked) blockedReason = 'ស្ថិតក្នុងម៉ោងព័ត៌មានសេដ្ឋកិច្ចធំ (High Impact News Window Active)';
  }

  // 3. Setup Flow Step (1 to 9 - Strict Fast Market Entry Flow)
  let currentStep = 1;
  if (!isRunning) {
    currentStep = 0; // IDLE
  } else if (activeTrade) {
    // If SL trailed beyond initial virtual SL or state is trailing
    const isTrailed = setup && activeTrade.sl && (activeTrade.side === 'BUY' ? activeTrade.sl > setup.virtualSLPrice : activeTrade.sl < setup.virtualSLPrice);
    currentStep = isTrailed || daraState === 'TRAILING' ? 8 : 7; // 8: TRAILING, 7: TRADE ACTIVE
  } else if (daraState === 'TRADE_CLOSED' || (setup?.status === 'EXECUTED' && !activeTrade)) {
    currentStep = 9; // 9: TRADE CLOSED
  } else if (daraState === 'EXECUTING') {
    currentStep = 6; // 6: MARKET EXECUTE
  } else if (daraState === 'MSS_CONFIRMED' || setup?.mssLevel || analysis?.mss?.buy === 'CONFIRMED' || analysis?.mss?.sell === 'CONFIRMED') {
    // MSS Confirmed -> evaluates safety
    currentStep = !isEntryBlocked ? 5 : 4; // 5: SAFETY CHECK (passing -> executes), 4: MSS CONFIRMED
  } else if (setup?.displacementConfirmed || analysis?.displacement?.buy === 'CONFIRMED' || analysis?.displacement?.sell === 'CONFIRMED') {
    currentStep = 3; // 3: DISPLACEMENT
  } else if ((setup?.sweepLevel && setup.sweepLevel > 0) || analysis?.liquiditySweep?.buy === 'DETECTED' || analysis?.liquiditySweep?.sell === 'DETECTED') {
    currentStep = 2; // 2: LIQUIDITY SWEEP
  } else {
    currentStep = 1; // 1: SCANNING
  }

  // 4. Setup Flow Step Definitions (9 Disciplined Steps Flow - Bilingual Khmer & English)
  const stepDefinitions = [
    { 
      num: 1, 
      name: 'SCANNING', 
      titleKh: 'កំពុងស្កេន M1', 
      descKh: 'ស្កេនទៀន M1 ស្វែងរក Swings & Liquidity', 
      descEn: 'Scan M1 candles for Swings & Liquidity' 
    },
    { 
      num: 2, 
      name: 'LIQUIDITY SWEEP', 
      titleKh: 'បោសយកសាច់ប្រាក់', 
      descKh: 'Wick ចេញហួស M1 Swing High/Low', 
      descEn: 'Wick beyond recent M1 Swing High/Low' 
    },
    { 
      num: 3, 
      name: 'DISPLACEMENT', 
      titleKh: 'ចលនាតម្លៃខ្លាំង', 
      descKh: 'ទៀនធ្លាក់/ឡើងខ្លាំងភ្លាមៗ (Impulsive Candle)', 
      descEn: 'Impulsive directional M1 displacement' 
    },
    { 
      num: 4, 
      name: 'MSS CONFIRMED', 
      titleKh: 'បញ្ជាក់ MSS', 
      descKh: 'Market Structure Shift បញ្ជាក់ទិសដៅច្បាស់', 
      descEn: 'Market Structure Shift confirmed' 
    },
    { 
      num: 5, 
      name: 'SAFETY CHECK', 
      titleKh: 'ផ្ទៀងផ្ទាត់សុវត្ថិភាព', 
      descKh: 'ត្រួតពិនិត្យប្រព័ន្ធសុវត្ថិភាពទាំង ៩ ចំណុច', 
      descEn: 'All 9 safety guards verification' 
    },
    { 
      num: 6, 
      name: 'MARKET EXECUTE', 
      titleKh: 'ចូល ORDER ទីផ្សារ', 
      descKh: 'Fast Market Execution (Ask/Bid) ភ្លាមៗ', 
      descEn: 'Instant Market Order (Ask/Bid) at market price' 
    },
    { 
      num: 7, 
      name: 'TRADE ACTIVE', 
      titleKh: 'TRADE ដំណើរការ', 
      descKh: 'បើក Order រួចរាល់ជាមួយ Hard SL & TP', 
      descEn: 'Position active with hard SL & TP' 
    },
    { 
      num: 8, 
      name: 'TRAILING', 
      titleKh: 'រំកិលការពារ SL', 
      descKh: 'Auto Trailing 1.5 ចាប់ផ្តើមនៅ TP រំកិលតាមទិសដៅ', 
      descEn: 'Auto Trailing 1.5 at TP (Monotonic SL)' 
    },
    { 
      num: 9, 
      name: 'TRADE CLOSED', 
      titleKh: 'TRADE បានបិទ', 
      descKh: 'បិទ Order រួចរាល់ → ស្កេន M1 ថ្មីបន្ត', 
      descEn: 'Position closed -> Reset to Scanning' 
    }
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
      msg: `[DaRa M1 EA v1.0] តាមដានទីផ្សារ M1 លើ Exness XAUUSD USC (M1 Market Scanning Active)`,
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

  useEffect(() => {
    const time = new Date().toLocaleTimeString('en-GB');

    const addLog = (msg: string, type: LogEntry['type'], level: LogEntry['level'] = 'info') => {
      setLogs(prev => [{ time, msg, type, level }, ...prev].slice(0, 150));
    };

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
        addLog(`[DaRa M1 EA v1.0] 🟢 សុវត្ថិភាពទាំង ៩ ចំណុចឆ្លងកាត់ទាំងអស់ — អនុញ្ញាតឱ្យចូល Order (All 9 Guards Passed)`, 'Safety', 'success');
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

  const lastTickAgeSeconds = state.lastTickTime ? Math.max(0, (Date.now() - state.lastTickTime) / 1000).toFixed(1) : '---';

  return (
    <div id="dara-m1-monitor" className="font-sans max-w-[1400px] mx-auto p-3 md:p-6 space-y-6 bg-[#05080F] min-h-screen text-slate-100">

      {/* ========================================================================= */}
      {/* SECTION 1: MAIN ENGINE & MARKET TELEMETRY BANNER (BILINGUAL)               */}
      {/* ========================================================================= */}
      <div id="dara-telemetry-header" className="bg-[#0B101A] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6">
          
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
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-slate-800/90 border border-slate-700 text-slate-300 whitespace-nowrap">
                  READ-ONLY MONITOR (ផ្ទាំងតាមដាន)
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
                ប្រព័ន្ធជួញដូរមាស M1 ICT ស្វ័យប្រវត្ត • Autonomous ICT Engine for Gold (XAUUSD) • Exness MT5
              </p>
            </div>
          </div>

          {/* Right: Engine Status Badge */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 w-full xl:w-auto justify-start xl:justify-end">
            <div className={`px-4 py-2 rounded-xl border font-mono text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm whitespace-nowrap transition-colors ${
              !isRunning 
                ? 'bg-rose-950/40 border-rose-600/40 text-rose-400' 
                : isEntryBlocked 
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' 
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                !isRunning 
                  ? 'bg-rose-500' 
                  : isEntryBlocked 
                    ? 'bg-amber-400 animate-ping' 
                    : 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
              }`}></span>
              <span>
                {!isRunning 
                  ? 'ម៉ាស៊ីន: បានបញ្ឈប់ (STOPPED)' 
                  : isEntryBlocked 
                    ? 'ម៉ាស៊ីន: ផ្អាកបណ្តោះអាសន្ន (PAUSED)' 
                    : 'ម៉ាស៊ីន: កំពុងដំណើរការ (RUNNING 24/7)'}
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
              <span>{isMt5Connected ? 'ភ្ជាប់ជោគជ័យ (CONNECTED)' : 'ដាច់ការភ្ជាប់ (OFFLINE)'}</span>
            </div>
          </div>

          {/* Card 2: Tick Stream */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-medium mb-1.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>ចរន្តតម្លៃ (Tick Stream)</span>
            </div>
            <div className="text-xs sm:text-sm font-bold font-mono text-amber-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
              <span>កំពុងទទួល (RECEIVING)</span>
            </div>
          </div>

          {/* Card 3: Bid Price */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1.5">
              តម្លៃទិញចូល (Bid Price)
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
              {state.bidPrice ? state.bidPrice.toFixed(3) : state.goldPrice ? state.goldPrice.toFixed(3) : '---'}
            </div>
          </div>

          {/* Card 4: Ask Price */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1.5">
              តម្លៃលក់ចេញ (Ask Price)
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
              {state.askPrice ? state.askPrice.toFixed(3) : '---'}
            </div>
          </div>

          {/* Card 5: Live Spread */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[78px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1.5">
              គម្លាតតម្លៃផ្ទាល់ (Spread)
            </div>
            <div className={`text-xs sm:text-sm font-bold font-mono flex items-baseline gap-2 flex-wrap ${currentSpread <= maxSpread ? 'text-cyan-400' : 'text-rose-400'}`}>
              <span className="text-base sm:text-lg font-bold">{currentSpread} pts</span>
              <span className="text-xs text-slate-400 font-normal">(Max: {maxSpread})</span>
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
          <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800/70 rounded-xl text-xs font-mono flex flex-wrap items-center justify-between gap-2.5 text-slate-300">
            <span className="text-slate-400 uppercase text-[11px] tracking-wider font-sans font-bold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> ទៀន M1 កំពុងរត់ (Active M1 Candle):
            </span>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
              <span>O: <span className="text-white font-bold">{analysis.currentCandle.open.toFixed(2)}</span></span>
              <span>H: <span className="text-emerald-400 font-bold">{analysis.currentCandle.high.toFixed(2)}</span></span>
              <span>L: <span className="text-rose-400 font-bold">{analysis.currentCandle.low.toFixed(2)}</span></span>
              <span>C: <span className="text-cyan-300 font-bold">{analysis.currentCandle.close.toFixed(2)}</span></span>
            </div>
            {analysis.previousCandle && (
              <div className="text-[11px] text-slate-400">
                បិទទៀនមុន (Prev Close): <span className="text-slate-200 font-bold">{analysis.previousCandle.close.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: 🔥 DARA LIVE SETUP FLOW (9 DISCIPLINED STEPS - BILINGUAL)       */}
      {/* ========================================================================= */}
      <div id="dara-setup-flow" className="bg-[#0B101A] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              🔥 លំហូរប្រតិបត្តិការ DaRa ៩ ជំហាន (9 Steps Fast Market Execution Flow)
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              វដ្តប្រតិបត្តិការ M1 យ៉ាងម៉ត់ចត់៖ ស្កេន ២៤/៧ → MSS CONFIRMED + SAFETY PASS → ចូល Market Order ភ្លាមៗ (Fast Market Entry) → Trailing 1.5 → Scan ថ្មី
            </p>
          </div>
          <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-cyan-400 whitespace-nowrap self-start sm:self-auto">
            បច្ចុប្បន្ន (CURRENT): ជំហាន {currentStep.toString().padStart(2, '0')}/09 ({stepDefinitions.find(s => s.num === currentStep)?.titleKh || 'IDLE'})
          </div>
        </div>

        {/* 9 Steps Grid / Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-9 gap-2.5">
          {stepDefinitions.map(step => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <div
                key={step.num}
                className={`relative p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between min-h-[128px] ${
                  isActive
                    ? 'bg-blue-950/50 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.35)] ring-2 ring-blue-500/60 scale-[1.02]'
                    : isCompleted
                      ? 'bg-emerald-950/20 border-emerald-600/40'
                      : 'bg-slate-900/40 border-slate-800/70 opacity-65'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-[0_0_10px_#3b82f6]'
                        : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isCompleted ? '✓' : step.num}
                    </span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {isActive ? '● សកម្ម (ACTIVE)' : isCompleted ? '✓ រួច (DONE)' : '○ រង់ចាំ (WAIT)'}
                    </span>
                  </div>

                  <h4 className={`text-xs font-bold leading-snug ${isActive ? 'text-white font-black' : isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                    {step.titleKh}
                  </h4>
                  <div className={`text-[10px] font-mono mt-0.5 tracking-wider uppercase ${isActive ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                    {step.name}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/50 text-[10px] text-slate-400 leading-snug space-y-0.5">
                  <div className={isActive ? 'text-slate-200 font-medium' : 'text-slate-300'}>{step.descKh}</div>
                  <div className="text-slate-500 font-mono text-[9px] truncate">{step.descEn}</div>
                </div>
              </div>
            );
          })}
        </div>

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
            {currentStep === 4 && '« MSS ត្រូវបានបញ្ជាក់ (MSS CONFIRMED)! បញ្ជូនទៅកាន់ការត្រួតពិនិត្យប្រព័ន្ធសុវត្ថិភាព • Market Structure Shift confirmed. Passing setup to Safety Check. »'}
            {currentStep === 5 && (isEntryBlocked 
              ? `« ការត្រួតពិនិត្យសុវត្ថិភាព៖ រារាំងមិនទាន់ឱ្យចូល (${blockedReason}) • Safety Guard Active: Entry blocked. »` 
              : '« ប្រព័ន្ធសុវត្ថិភាពទាំង ៩ ចំណុចឆ្លងកាត់ទាំងអស់ (SAFETY PASS)! រួចរាល់ដើម្បីចូល Market Order ភ្លាមៗ • All 9 safety guards passed! Ready for instant market order execution. »')}
            {currentStep === 6 && '« កំពុងបញ្ជូន Market Order ភ្លាមៗ (Fast Market Execution) ទៅកាន់ Exness MT5 (Ask សម្រាប់ BUY / Bid សម្រាប់ SELL)... • Dispatching instant market order to broker at live market price... »'}
            {currentStep === 7 && `« Trade កំពុងដំណើរការជាមួយសំបុត្រ #${activeTrade?.ticket || 'LIVE'} (Hard SL & TP ការពាររួចរាល់) • Trade active with Ticket #${activeTrade?.ticket || 'LIVE'}. Initial SL & TP established. »`}
            {currentStep === 8 && '« Auto Trailing 1.5 កំពុងដំណើរការ! SL រំកិលតាមទិសដៅតែប៉ុណ្ណោះ មិនដែលថយក្រោយ • Auto Trailing active at TP. Stop Loss advances monotonically with 1.5 price distance. »'}
            {currentStep === 9 && (lastClosedTrade 
              ? `« Trade #${lastClosedTrade.ticket} ត្រូវបានបិទបញ្ចប់ដោយ ${lastClosedTrade.exitReason} (${lastClosedTrade.pnl >= 0 ? '+' : ''}${lastClosedTrade.pnl.toFixed(2)})! កំណត់ប្រព័ន្ធឡើងវិញ → ត្រឡប់មកស្កេន M1 ថ្មី • Trade closed via ${lastClosedTrade.exitReason}. Resetting engine to Step 01 (Scanning) for next setup. »`
              : '« Trade ត្រូវបានបិទបញ្ចប់! កំណត់ប្រព័ន្ធឡើងវិញ → ត្រឡប់មកស្កេន M1 ថ្មី (ជំហានទី ០១) • Trade closed. Resetting engine to Step 01 (Scanning) for next setup. »')}
          </div>
        </div>

        {/* Closed Trade Summary Card (when trade is closed or last closed trade is recorded) */}
        {lastClosedTrade && !activeTrade && (
          <div className="mt-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-md font-bold font-mono text-[11px] uppercase tracking-wider ${
                lastClosedTrade.exitReason === 'TP_HIT' 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                  : lastClosedTrade.exitReason === 'TRAILING_SL_HIT'
                    ? 'bg-blue-950 text-cyan-300 border border-blue-500/40'
                    : 'bg-rose-950 text-rose-400 border border-rose-500/40'
              }`}>
                {lastClosedTrade.exitReason === 'TP_HIT' ? '✅ TP HIT' :
                 lastClosedTrade.exitReason === 'TRAILING_SL_HIT' ? '🔒 TRAILING SL HIT' :
                 '❌ SL HIT'}
              </span>
              <span className="font-mono text-slate-300">
                Ticket: <strong className="text-white">#{lastClosedTrade.ticket}</strong> ({lastClosedTrade.type} {lastClosedTrade.lot} lots)
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-slate-300">
              <span>Entry: <strong className="text-white">{lastClosedTrade.openPrice.toFixed(3)}</strong></span>
              <span>Exit: <strong className="text-white">{lastClosedTrade.closePrice.toFixed(3)}</strong></span>
              <span>P/L: <strong className={lastClosedTrade.pnl >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                {lastClosedTrade.pnl >= 0 ? `+${lastClosedTrade.pnl.toFixed(2)}` : `${lastClosedTrade.pnl.toFixed(2)}`} USC
              </strong></span>
              <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                🔄 ស្កេន M1 ថ្មី (Scanning M1)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: 🛡 SAFETY STATUS (BILINGUAL 9 GUARDS MATRIX)                    */}
      {/* ========================================================================= */}
      <div className="w-full">
        {/* SECTION 3B: 🛡 SAFETY MATRIX (9 GUARDS WITH PASS / BLOCKED - BILINGUAL) */}
        <div id="dara-safety-matrix" className="bg-[#0B101A] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                🛡 ស្ថានភាពប្រព័ន្ធសុវត្ថិភាព (Safety Status - 9 Guards Matrix)
              </h3>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                !isEntryBlocked 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-950 text-rose-400 border border-rose-500/30'
              }`}>
                {!isEntryBlocked ? '🟢 ៩/៩ ឆ្លងកាត់ (9/9 PASS)' : '🔴 ជាប់ការរារាំង (GUARD ACTIVE)'}
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
                    🟢 អនុញ្ញាតឱ្យចូល ORDER — ប្រព័ន្ធសុវត្ថិភាពទាំង ៩ ឆ្លងកាត់ទាំងអស់ (FAST ENTRY ALLOWED)
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
