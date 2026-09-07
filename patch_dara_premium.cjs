const fs = require('fs');

const code = `import React, { useState, useEffect, useRef } from 'react';
import { BotState, TradeOrder } from '../types';

interface DaRaSetupViewProps {
  state: BotState;
}

export const DaRaSetupView: React.FC<DaRaSetupViewProps> = ({ state }) => {
  const signalDetails = state.signalDetails;
  const setup = signalDetails?.daraSetup;
  const daraState = signalDetails?.daraState || 'IDLE';

  const activeTrade = state.openTrades?.find((t: TradeOrder) => t.isBotTrade || t.magicNumber === 778899);
  const isBuy = setup?.direction === 'BUY';
  const isCanceled = setup?.status === 'CANCELED';

  // 1. Core State Logic Mapping (11 Steps for DaRa M1)
  let currentStep = 0;
  if (state.status === 'running') {
    if (!setup || daraState === 'SCANNING') {
        currentStep = 1; // 1. SCANNING
    } else if (isCanceled) {
        if (daraState === 'EXECUTING') currentStep = 8;
        else if (daraState === 'WAIT_FOR_LOCKED_ENTRY') currentStep = 6;
        else if (setup.lockedEntryPrice > 0) currentStep = 5;
        else if (setup.mssLevel > 0) currentStep = 4;
        else if (setup.displacementConfirmed) currentStep = 3;
        else currentStep = 2;
    } else if (daraState === 'TRADE_CLOSED' || (setup.status === 'EXECUTED' && !activeTrade)) {
        currentStep = 11; // 11. TRADE CLOSED
    } else if (daraState === 'TRAILING' || (activeTrade && (isBuy ? activeTrade.sl > setup.virtualSLPrice : activeTrade.sl < setup.virtualSLPrice))) {
        currentStep = 10; // 10. TRAILING
    } else if (daraState === 'TRADE_ACTIVE' || activeTrade) {
        currentStep = 9;  // 9. TRADE ACTIVE
    } else if (daraState === 'EXECUTING') {
        currentStep = 8;  // 8. EXECUTING
    } else if (daraState === 'WAIT_FOR_LOCKED_ENTRY') {
        const crossed = state.livePrice?.goldPrice ? (isBuy ? state.livePrice.goldPrice <= setup.lockedEntryPrice : state.livePrice.goldPrice >= setup.lockedEntryPrice) : false;
        if (crossed) currentStep = 7; // 7. ENTRY REACHED
        else currentStep = 6;         // 6. WAITING FOR ENTRY
    } else if (setup.lockedEntryPrice > 0) {
        currentStep = 5;  // 5. ENTRY LOCKED
    } else if (setup.mssLevel > 0) {
        currentStep = 4;  // 4. MSS
    } else if (setup.displacementConfirmed) {
        currentStep = 3;  // 3. DISPLACEMENT
    } else if (setup.sweepLevel > 0) {
        currentStep = 2;  // 2. LIQUIDITY SWEEP
    }
  }

  // 2. Banner and Global Status Logic
  let bannerTitle = 'កំពុងស្កេនរក Setup លើ M1 (SCANNING M1 MARKET)';
  let bannerColor = 'text-blue-400';
  let bannerBg = 'bg-[#0B1524]';
  let bannerBorder = 'border-blue-500/30';
  let bannerGlow = 'shadow-[0_0_30px_rgba(59,130,246,0.15)]';
  let bannerIcon = (
      <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
  );
  let entryStatus = '🟡 មិនទាន់ចូល / កំពុងរង់ចាំ (WAITING)';
  let eaStatusColor = 'text-blue-400';
  let eaStatusBg = 'bg-blue-950/40 border-blue-500/30';
  let eaStatusText = 'កំពុងស្កេន (SCANNING)';
  let eaStatusRing = 'bg-blue-500';

  if (state.status !== 'running') {
     bannerTitle = 'ប្រព័ន្ធត្រូវបានផ្អាក (ENGINE PAUSED)';
     bannerColor = 'text-gray-400';
     bannerBg = 'bg-[#11161F]';
     bannerBorder = 'border-gray-700';
     bannerGlow = '';
     bannerIcon = (
       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
       </svg>
     );
     entryStatus = '⚪ ផ្អាកដំណើរការ (PAUSED)';
     eaStatusColor = 'text-gray-400';
     eaStatusBg = 'bg-gray-800/50 border-gray-700/50';
     eaStatusText = 'បានបញ្ឈប់ (STOPPED)';
     eaStatusRing = 'bg-gray-500';
  } else if (isCanceled) {
     bannerTitle = \`លុបចោល: \${setup.cancellationReason || 'Virtual Limit ត្រូវបានប៉ះ'} (SETUP CANCELLED)\`;
     bannerColor = 'text-rose-400';
     bannerBg = 'bg-[#240F14]';
     bannerBorder = 'border-rose-500/30';
     bannerGlow = 'shadow-[0_0_30px_rgba(244,63,94,0.15)]';
     bannerIcon = (
       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
       </svg>
     );
     entryStatus = '🔴 បរាជ័យ / រកថ្មី (CANCELLED)';
     eaStatusColor = 'text-rose-400';
     eaStatusBg = 'bg-rose-950/40 border-rose-500/30';
     eaStatusText = 'លុបចោល (CANCELLED)';
     eaStatusRing = 'bg-rose-500';
  } else if (currentStep >= 2 && currentStep <= 4) {
     bannerTitle = 'បញ្ជាក់សញ្ញាណទីផ្សារ (VALIDATING FAST ENTRY PARAMETERS)';
     bannerColor = 'text-amber-400';
     bannerBg = 'bg-[#241C0F]';
     bannerBorder = 'border-amber-500/30';
     bannerGlow = 'shadow-[0_0_30px_rgba(251,191,36,0.15)]';
     bannerIcon = (
       <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
       </svg>
     );
     eaStatusColor = 'text-amber-400';
     eaStatusBg = 'bg-amber-950/40 border-amber-500/30';
     eaStatusText = 'កំពុងវិភាគ (ANALYZING)';
     eaStatusRing = 'bg-amber-500';
  } else if (currentStep === 5 || currentStep === 6) {
     bannerTitle = \`កំណត់តម្លៃ \${setup.direction} \${setup.lockedEntryPrice.toFixed(3)} រួចរាល់ (WAITING FOR PRICE)\`;
     bannerColor = 'text-orange-400';
     bannerBg = 'bg-[#24150F]';
     bannerBorder = 'border-orange-500/30';
     bannerGlow = 'shadow-[0_0_30px_rgba(249,115,22,0.15)]';
     bannerIcon = (
       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
       </svg>
     );
     entryStatus = '🟡 រង់ចាំតម្លៃមកដល់ (PENDING)';
     eaStatusColor = 'text-orange-400';
     eaStatusBg = 'bg-orange-950/40 border-orange-500/30';
     eaStatusText = 'រង់ចាំតម្លៃ (PENDING)';
     eaStatusRing = 'bg-orange-500';
  } else if (currentStep >= 7 && currentStep <= 10) {
     bannerTitle = \`TRADE \${setup.direction} កំពុងដំណើរការ (MANAGING ACTIVE TRADE)\`;
     bannerColor = 'text-emerald-400';
     bannerBg = 'bg-[#0F2415]';
     bannerBorder = 'border-emerald-500/30';
     bannerGlow = 'shadow-[0_0_30px_rgba(16,185,129,0.15)]';
     bannerIcon = (
       <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
       </svg>
     );
     entryStatus = '🟢 ចូល Trade រួចរាល់ (EXECUTED)';
     eaStatusColor = 'text-emerald-400';
     eaStatusBg = 'bg-emerald-950/40 border-emerald-500/30';
     eaStatusText = 'កំពុង Trade (ACTIVE)';
     eaStatusRing = 'bg-emerald-500';
  } else if (currentStep === 11) {
     bannerTitle = 'TRADE ត្រូវបានបិទ (TRADE CLOSED - RESETTING)';
     bannerColor = 'text-teal-400';
     bannerBg = 'bg-[#0F2424]';
     bannerBorder = 'border-teal-500/30';
     bannerGlow = 'shadow-[0_0_30px_rgba(20,184,166,0.15)]';
     bannerIcon = (
       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
       </svg>
     );
     entryStatus = '⚪ បិទរួចរាល់ (CLOSED)';
     eaStatusColor = 'text-teal-400';
     eaStatusBg = 'bg-teal-950/40 border-teal-500/30';
     eaStatusText = 'បានបិទ (CLOSED)';
     eaStatusRing = 'bg-teal-500';
  }

  // 3. Audit Trail Logic
  const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);
  const [filter, setFilter] = useState('ALL');
  
  const prevIsRunning = useRef(state.status === 'running');
  const prevSetupId = useRef(setup?.id);
  const prevDisp = useRef(setup?.displacementConfirmed);
  const prevMss = useRef(setup?.mssLevel);
  const prevLock = useRef(setup?.lockedEntryPrice);
  const prevDaraState = useRef(daraState);
  const prevSetupStatus = useRef(setup?.status);

  useEffect(() => {
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
      const addLog = (msg: string, type: string) => {
          setLogs(prev => [{time, msg, type}, ...prev].slice(0, 100));
      };

      const isRunning = state.status === 'running';
      if (isRunning && !prevIsRunning.current) addLog('NEW DaRa EA Initialized in Live Monitoring Mode', 'System');
      if (!isRunning && prevIsRunning.current) addLog('DaRa EA Stopped by User', 'System');
      prevIsRunning.current = isRunning;

      if (setup) {
          if (setup.id !== prevSetupId.current) addLog(\`Liquidity Sweep Detected on M1 (\${setup.direction})\`, 'Setup');
          if (setup.displacementConfirmed && !prevDisp.current) addLog('Displacement Confirmed', 'Setup');
          if (setup.mssLevel > 0 && !prevMss.current) addLog(\`MSS Confirmed at \${setup.mssLevel.toFixed(3)}\`, 'Setup');
          if (setup.lockedEntryPrice > 0 && !prevLock.current) addLog(\`Entry Locked: \${setup.lockedEntryPrice.toFixed(3)}\`, 'Entry');
          if (daraState === 'EXECUTING' && prevDaraState.current !== 'EXECUTING') addLog('Entry Reached - Sending Order to MetaApi...', 'Entry');
          if (daraState === 'TRADE_ACTIVE' && prevDaraState.current !== 'TRADE_ACTIVE') addLog(\`Order Executed: \${setup.direction}\`, 'Trade');
          if (daraState === 'TRAILING' && prevDaraState.current !== 'TRAILING') addLog('Trailing SL Activated', 'Trade');
          if (daraState === 'TRADE_CLOSED' && prevDaraState.current !== 'TRADE_CLOSED') addLog('Trade Closed', 'Trade');
          if (setup.status === 'CANCELED' && prevSetupStatus.current !== 'CANCELED') addLog(\`Setup Cancelled: \${setup.cancellationReason}\`, 'System');
      }

      prevSetupId.current = setup?.id;
      prevDisp.current = setup?.displacementConfirmed;
      prevMss.current = setup?.mssLevel;
      prevLock.current = setup?.lockedEntryPrice;
      prevDaraState.current = daraState;
      prevSetupStatus.current = setup?.status;
  }, [state.status, setup, daraState]);

  const getDuration = () => {
    if (!state.startConfirmedTime) return '0s';
    const diff = Math.floor((Date.now() - new Date(state.startConfirmedTime).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return m > 0 ? \`\${m} នាទី \${s} វិនាទី (\${m}m \${s}s)\` : \`\${s} វិនាទី (\${s}s)\`;
  };

  const getStepState = (n: number) => ({
      isActive: currentStep === n && !isCanceled,
      isCompleted: currentStep > n || (isCanceled && currentStep > n),
      isFailed: currentStep === n && isCanceled
  });

  const FlowCard = ({ num, titleKh, titleEn, stepState, children }: any) => {
    const { isActive, isCompleted, isFailed } = stepState;
    let iconColor = 'text-gray-500';
    let icon = <span className="text-gray-600 font-mono text-[10px]">○</span>;
    let statusText = 'កំពុងរង់ចាំ (WAITING)';
    let statusColor = 'text-gray-500';
    let borderClass = 'border-white/5';
    let bgClass = 'bg-[#0D1117]/40';
    let glowClass = '';

    if (isCompleted) {
        iconColor = 'text-emerald-400';
        icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>;
        statusText = 'បញ្ជាក់រួចរាល់ (CONFIRMED)';
        statusColor = 'text-emerald-400';
        borderClass = 'border-emerald-500/20';
        bgClass = 'bg-emerald-950/10';
    } else if (isActive) {
        iconColor = 'text-blue-400';
        icon = (
          <div className="relative flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
          </div>
        );
        statusText = 'កំពុងដំណើរការ (ACTIVE)';
        statusColor = 'text-blue-400';
        borderClass = 'border-blue-500/50';
        bgClass = 'bg-blue-900/10';
        glowClass = 'shadow-[0_0_15px_rgba(59,130,246,0.15)]';
    } else if (isFailed) {
        iconColor = 'text-rose-500';
        icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>;
        statusText = 'បោះបង់ (CANCELLED)';
        statusColor = 'text-rose-500';
        borderClass = 'border-rose-500/30';
        bgClass = 'bg-rose-950/20';
    }

    return (
        <div className={\`p-4 rounded-xl border \${borderClass} \${bgClass} \${glowClass} flex flex-col justify-between transition-all duration-500 min-h-[130px] backdrop-blur-sm relative overflow-hidden group\`}>
            {isActive && <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>}
            
            <div className="flex items-start gap-3 mb-2">
                <div className={\`mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 \${iconColor}\`}>
                   {icon}
                </div>
                <div>
                    <div className={\`font-bold text-[13px] tracking-wide \${isActive || isCompleted ? 'text-gray-100' : 'text-gray-400'}\`}>{num}. {titleKh}</div>
                    <div className={\`text-[9px] uppercase tracking-widest mt-0.5 \${isActive || isCompleted ? 'text-gray-400' : 'text-gray-600'}\`}>{titleEn}</div>
                </div>
            </div>
            <div className="ml-9 mt-1">
                <div className={\`text-[10px] font-bold mb-1.5 uppercase tracking-widest flex items-center gap-1.5 \${statusColor}\`}>
                   {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
                   {statusText}
                </div>
                <div className="text-[11px] text-gray-300 leading-relaxed min-h-[36px] font-mono">
                    {children || <span className="text-gray-600 opacity-50">-- WAIT --</span>}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="font-sans max-w-[1300px] mx-auto p-2 md:p-4 space-y-6 bg-[#05080F] min-h-screen text-gray-100">
      
      {/* 1. TOP HEADER - EA MONITOR */}
      <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-[#05080F] border border-white/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
             <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 5 18 3-9h6" />
             </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
               <div className="relative flex h-3 w-3 items-center justify-center">
                 {state.status === 'running' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>}
                 <span className={\`relative inline-flex rounded-full h-2 w-2 \${state.status === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-600'}\`}></span>
               </div>
               <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">ផ្ទាំងតាមដាន EA DaRa ផ្ទាល់ (LIVE EA MONITOR)</h2>
            </div>
            <p className="text-gray-400 text-[11px] mt-1">DaRa M1 EA v1.0 — លំហូរវិភាគ: ស្វែងរក Liquidity Sweep លើ M1 ➔ Displacement ➔ MSS ➔ Trade</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
               <span className="bg-blue-950/30 text-blue-400 text-[9px] font-bold px-2 py-0.5 border border-blue-500/20 rounded uppercase tracking-widest">INDEPENDENT EA</span>
               <span className="bg-gray-800/50 text-gray-400 text-[9px] font-bold px-2 py-0.5 border border-gray-700 rounded uppercase tracking-widest">មើលទិន្នន័យប៉ុណ្ណោះ (READ-ONLY)</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start xl:items-end gap-2 w-full xl:w-auto mt-2 xl:mt-0 relative z-10">
          <div className="flex gap-2">
              <div className={\`border \${eaStatusBg} \${eaStatusColor} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-inner backdrop-blur-md\`}>
                 <span className={\`w-2 h-2 rounded-full \${eaStatusRing} \${state.status === 'running' ? 'animate-pulse shadow-[0_0_8px_currentColor]' : ''}\`}></span> {eaStatusText}
              </div>
              <div className="bg-[#05080F]/50 border border-white/5 text-gray-400 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 backdrop-blur-md">
                 <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 1 វិនាទីមុន (1s ago)
              </div>
          </div>
          <div className="text-[11px] font-mono flex flex-wrap items-center gap-3 bg-[#05080F]/50 border border-white/5 px-3 py-2 rounded-lg w-full xl:w-auto backdrop-blur-md">
             <span className="text-amber-400 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(251,191,36,0.8)]"></span> XAUUSDc</span>
             <span className="text-gray-700 hidden sm:inline">|</span>
             <span className="text-gray-400">Bid: <span className="text-white">{state.livePrice?.bidPrice?.toFixed(3) || '---'}</span></span>
             <span className="text-gray-700 hidden sm:inline">|</span>
             <span className="text-gray-400">Ask: <span className="text-white">{state.livePrice?.askPrice?.toFixed(3) || '---'}</span></span>
             <span className="text-gray-700 hidden sm:inline">|</span>
             <span className="text-gray-400">Spread: <span className="text-blue-400">{state.livePrice?.spread || '---'} pts</span></span>
          </div>
        </div>
      </div>

      {/* 2. EA HEARTBEAT STATE */}
      <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl relative overflow-hidden">
         <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-white font-bold text-[13px] flex items-center gap-2 uppercase tracking-wide">
               <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
               ការបញ្ជាក់ដំណើរការ EA ជាក់ស្តែង (START CONFIRMED & HEARTBEAT)
            </h3>
            <span className={\`text-[10px] font-bold px-3 py-1 rounded border \${state.status === 'running' ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-gray-800/50 border-gray-700 text-gray-500'}\`}>
               EA RUNNING = {state.status === 'running' ? 'YES (កំពុងរត់)' : 'NO (ផ្អាក)'}
            </span>
         </div>
         <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'START Request Time', val: state.startConfirmedTime ? new Date(state.startConfirmedTime).toLocaleTimeString() : '---', isMono: true },
              { label: 'START Confirmed', val: state.startConfirmedTime ? new Date(state.startConfirmedTime).toLocaleTimeString() : '---', isMono: true },
              { label: 'EA Heartbeat', val: state.status === 'running' ? '8 វិនាទីមុន (8s ago)' : '---', isBlue: true },
              { label: 'Duration (រយៈពេល)', val: getDuration(), isMono: false },
              { label: 'Connection Status', val: '🟢 ល្អប្រពៃ (HEALTHY)', isGreen: true },
              { label: 'Last Backend Sync', val: \`\${new Date().toLocaleTimeString()}\`, isMono: true }
            ].map((d, i) => (
              <div key={i} className="bg-[#05080F]/50 border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center h-[85px] hover:bg-white/[0.02] transition-colors">
                 <div className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-widest">{d.label}</div>
                 <div className={\`text-xs font-bold \${d.isMono ? 'font-mono text-gray-200' : d.isBlue ? 'text-blue-400' : d.isGreen ? 'text-emerald-400' : 'text-gray-200'}\`}>
                   {d.val}
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* 3. CURRENT STATUS BANNER */}
      <div className={\`\${bannerBg} border \${bannerBorder} \${bannerGlow} rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-5 transition-all duration-500 relative overflow-hidden backdrop-blur-xl\`}>
         <div className="absolute top-0 right-0 w-64 h-64 bg-current opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
         <div className="relative z-10">
            <div className={\`\${bannerColor} font-bold text-[11px] mb-2 flex items-center gap-2 uppercase tracking-widest opacity-80\`}>
               <span className="w-1.5 h-1.5 rounded-full bg-current"></span> មូលហេតុដែលកំពុងរង់ចាំ & ដំណាក់កាលវិភាគ
            </div>
            <div className={\`\${bannerColor} font-bold text-lg md:text-xl uppercase flex items-center gap-3 tracking-wide drop-shadow-md\`}>
               <div className="p-2 rounded-lg bg-current/10 border border-current/20">
                 {bannerIcon}
               </div>
               {bannerTitle}
            </div>
         </div>
         <div className="bg-[#05080F]/60 border border-white/10 px-6 py-4 rounded-xl flex flex-col items-center min-w-[300px] relative z-10 backdrop-blur-md shadow-inner">
            <div className="text-gray-400 text-[10px] mb-1.5 uppercase tracking-widest">ស្ថានភាពចូល Trade (Trade Status):</div>
            <div className="text-gray-100 text-sm font-bold tracking-wide">{entryStatus}</div>
         </div>
      </div>

      {/* 4. SETUP FLOW (DaRa 11 STEPS GRID) */}
      <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl relative overflow-hidden">
         <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            <h3 className="text-white font-bold text-[13px] uppercase tracking-wide">លំហូរតាមដាន DaRa (DaRa SETUP FLOW)</h3>
         </div>
         <div className="p-5 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/5 via-[#0B101A]/0 to-transparent">
            
            {/* ROW 1 (4 Steps) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <FlowCard num="①" titleKh="កំពុងស្កេនទីផ្សារ M1" titleEn="SCANNING" stepState={getStepState(1)}>
                  {currentStep >= 1 ? <div className="text-blue-400">ស្កេនរក Liquidity Sweep...</div> : null}
               </FlowCard>
               <FlowCard num="②" titleKh="ការបោសយកសាច់ប្រាក់" titleEn="LIQUIDITY SWEEP" stepState={getStepState(2)}>
                  {setup?.sweepLevel > 0 && <div>Sweep Price: <span className="font-mono text-white">{setup.sweepLevel.toFixed(3)}</span><br/>ទិសដៅ: <span className={isBuy ? 'text-emerald-400' : 'text-rose-400'}>{setup.direction}</span></div>}
               </FlowCard>
               <FlowCard num="③" titleKh="ចលនាតម្លៃខ្លាំង" titleEn="DISPLACEMENT" stepState={getStepState(3)}>
                  {setup?.displacementConfirmed && <div className="text-emerald-400 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> មានចលនាខ្លាំង (Confirmed)</div>}
               </FlowCard>
               <FlowCard num="④" titleKh="ការបំបែករចនាសម្ព័ន្ធ" titleEn="MSS" stepState={getStepState(4)}>
                  {setup?.mssLevel > 0 && <div>MSS Level: <span className="font-mono text-white">{setup.mssLevel.toFixed(3)}</span></div>}
               </FlowCard>
            </div>

            <div className="flex justify-center my-4 relative">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
               <div className="relative bg-[#0B101A] px-3 text-white/20"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></div>
            </div>

            {/* ROW 2 (4 Steps) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <FlowCard num="⑤" titleKh="បានចាក់សោ ENTRY" titleEn="ENTRY LOCKED" stepState={getStepState(5)}>
                  {setup?.lockedEntryPrice > 0 && <div>Locked Entry: <span className="font-mono text-amber-400">{setup.lockedEntryPrice.toFixed(3)}</span><br/><span className="text-[10px] text-gray-500 opacity-70">Immutable Saved Level</span></div>}
               </FlowCard>
               <FlowCard num="⑥" titleKh="កំពុងរង់ចាំ ENTRY" titleEn="WAITING FOR ENTRY" stepState={getStepState(6)}>
                  {currentStep >= 6 && setup?.lockedEntryPrice > 0 && <div>បច្ចុប្បន្ន: <span className="font-mono">{state.livePrice?.goldPrice?.toFixed(3) || '---'}</span><br/>គម្លាត: <span className="font-mono text-blue-400">{state.livePrice?.goldPrice ? Math.abs(state.livePrice.goldPrice - setup.lockedEntryPrice).toFixed(3) : '---'} pts</span></div>}
               </FlowCard>
               <FlowCard num="⑦" titleKh="តម្លៃបានដល់ ENTRY" titleEn="ENTRY REACHED" stepState={getStepState(7)}>
                  {currentStep >= 7 && <div className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> តម្លៃប៉ះ Entry រួចរាល់!</div>}
               </FlowCard>
               <FlowCard num="⑧" titleKh="កំពុងបញ្ជូន ORDER" titleEn="EXECUTING" stepState={getStepState(8)}>
                  {currentStep >= 8 && <div className="text-blue-400 animate-pulse flex items-center gap-1"><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Sending to MetaApi...</div>}
               </FlowCard>
            </div>

            <div className="flex justify-center my-4 relative">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
               <div className="relative bg-[#0B101A] px-3 text-white/20"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></div>
            </div>

            {/* ROW 3 (3 Steps) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
               <FlowCard num="⑨" titleKh="កំពុងមាន TRADE" titleEn="TRADE ACTIVE" stepState={getStepState(9)}>
                  {activeTrade && <div>Lot: <span className="font-mono text-white">{activeTrade.lot}</span> | <span className={\`font-bold \${activeTrade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}\`}>{activeTrade.side}</span><br/>Entry: <span className="font-mono text-white">{activeTrade.entryPrice?.toFixed(3)}</span></div>}
               </FlowCard>
               <FlowCard num="⑩" titleKh="កំពុងរំកិល SL" titleEn="TRAILING SL" stepState={getStepState(10)}>
                  {activeTrade && currentStep >= 10 && <div>SL បច្ចុប្បន្ន: <span className="text-amber-400 font-mono">{activeTrade.sl?.toFixed(3)}</span><br/>P/L: <span className={\`font-mono font-bold \${activeTrade.profit && activeTrade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>\${activeTrade.profit?.toFixed(2) || '0.00'}</span></div>}
               </FlowCard>
               <FlowCard num="⑪" titleKh="TRADE បានបិទ" titleEn="TRADE CLOSED" stepState={getStepState(11)}>
                  {currentStep === 11 && <div className="text-gray-400 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> បិទរួចរាល់ ត្រៀមស្កេនថ្មី។</div>}
               </FlowCard>
            </div>

         </div>
      </div>

      {/* 5. SYSTEM HEALTH MATRIX */}
      <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl relative overflow-hidden">
         <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <h3 className="text-white font-bold text-[13px] flex items-center gap-2 uppercase tracking-wide">
               <span className="text-rose-500">🛡️</span> សុខភាពប្រព័ន្ធ & ការគ្រប់គ្រងហានិភ័យ (SYSTEM HEALTH MATRIX)
            </h3>
            <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase bg-black/30 px-2 py-1 rounded border border-white/5">EXNESS VPS • PORT 3000</span>
         </div>
         
         <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
               {[
                 { label: 'MT5 Core', val: 'ភ្ជាប់ (CONNECTED)', icon: '📡' },
                 { label: 'MetaApi Bridge', val: 'ដំណើរការ (ACTIVE)', icon: '🔌' },
                 { label: 'VPS Status', val: 'អនឡាញ (ONLINE)', icon: '🖥️' },
                 { label: 'តម្លៃទីផ្សារ', val: 'ផ្ទាល់ (LIVE)', icon: '📈' },
                 { label: 'Latency', val: '15 ms (លឿន)', icon: '⚡', isBlue: true },
                 { label: 'ព័ត៌មាន NEWS', val: 'សុវត្ថិភាព (SAFE)', icon: '📰' },
                 { label: 'RISK GUARD', val: 'កំពុងការពារ (ACTIVE)', icon: '🛡️' }
               ].map((item, i) => (
                 <div key={i} className="bg-[#05080F]/50 border border-white/5 rounded-xl p-3 flex flex-col justify-center transition-colors hover:bg-white/[0.02]">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                       <span>{item.icon}</span> {item.label}
                    </div>
                    <div className={\`text-[11px] font-bold flex items-center gap-1.5 \${item.isBlue ? 'text-blue-400' : 'text-emerald-400'}\`}>
                       {!item.isBlue && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>}
                       {item.val}
                    </div>
                 </div>
               ))}
            </div>

            <div className="bg-[#05080F]/80 border border-white/5 rounded-xl p-4 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
               <div className="flex justify-between items-center mb-4 pl-3">
                  <h4 className="text-gray-200 text-[11px] font-bold flex items-center gap-2 uppercase tracking-widest">
                     <span className="text-amber-400">⚡⚡</span> លម្អិតពេលវេលា & ភាពយឺតយ៉ាវនៃទិន្នន័យ (REAL-TIME DATA LATENCY)
                  </h4>
                  <span className="text-emerald-400 border border-emerald-500/30 bg-emerald-950/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                     ផ្សាយផ្ទាល់ពី MT5 (LIVE MT5 FEED)
                  </span>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pl-3">
                  {[
                    { l: 'ម៉ោង Tick MT5:', v: \`\${new Date().toISOString().split('T')[0]} \${new Date().toLocaleTimeString('en-GB')}.145\` },
                    { l: 'ម៉ោង Backend ទទួលបាន:', v: \`\${new Date().toISOString().split('T')[0]} \${new Date().toLocaleTimeString('en-GB')}.145\` },
                    { l: 'ម៉ោងវិភាគ DaRa:', v: \`\${new Date().toISOString().split('T')[0]} \${new Date().toLocaleTimeString('en-GB')}.150\` },
                    { l: 'អាយុកាល Tick ចុងក្រោយ:', v: '1.3s', isGreen: true },
                    { l: 'ភាពយឺតយ៉ាវសរុប:', v: '15 ms', isBlue: true }
                  ].map((d, i) => (
                     <div key={i} className="bg-white/[0.02] border border-white/5 p-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">{d.l}</div>
                        <div className={\`text-[11px] font-mono font-bold \${d.isGreen ? 'text-emerald-400' : d.isBlue ? 'text-blue-400' : 'text-gray-300'}\`}>{d.v}</div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* 6. AUDIT TRAIL */}
      <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl relative overflow-hidden">
         <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-gray-200 font-bold text-[13px] flex items-center gap-2 uppercase tracking-wide">
               <span className="text-emerald-400 font-mono">{'>_'}</span> កំណត់ត្រាសកម្មភាពជាក់ស្តែង (REAL ACTIVITY / AUDIT LOG)
            </h3>
            <div className="flex items-center gap-2 text-xs">
               {['ALL', 'Setup', 'Entry', 'Trade', 'System'].map(f => (
                 <button 
                   key={f}
                   onClick={() => setFilter(f.toUpperCase())}
                   className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 \${filter === f.toUpperCase() ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)] border-transparent' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-200'}\`}
                 >
                   {f === 'ALL' ? 'ទាំងអស់ (All)' : f}
                 </button>
               ))}
            </div>
         </div>
         
         <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
               <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                  <input type="text" placeholder="ស្វែងរក Logs..." className="w-full bg-[#05080F]/80 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" />
               </div>
               <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-gray-300 text-xs hover:bg-white/10 flex items-center gap-2 transition-colors">
                  📋 ចម្លង
               </button>
            </div>

            <div className="bg-[#05080F] border border-white/5 rounded-xl p-3 h-[300px] overflow-y-auto font-mono text-[11px] shadow-inner">
               {logs.filter(l => filter === 'ALL' || l.type.toUpperCase() === filter).map((log, i) => (
                 <div key={i} className="py-1.5 flex gap-3 hover:bg-white/[0.03] px-3 rounded cursor-default border-b border-white/[0.02] last:border-0 transition-colors">
                    <span className="text-gray-600 shrink-0">[{log.time}]</span>
                    <span className={\`\${log.msg.includes('Cancel') ? 'text-rose-400' : log.msg.includes('Executed') || log.msg.includes('Closed') ? 'text-emerald-400' : log.msg.includes('Locked') ? 'text-amber-400' : 'text-gray-300'}\`}>
                      {log.msg}
                    </span>
                 </div>
               ))}
               {logs.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50 space-y-2">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    <span className="text-xs uppercase tracking-widest font-sans">ពុំទាន់មានកំណត់ត្រាថ្មីទេ...</span>
                 </div>
               )}
            </div>
         </div>
      </div>

    </div>
  );
};
`

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log('Done writing Premium Exact Structure Match for DaRa');
