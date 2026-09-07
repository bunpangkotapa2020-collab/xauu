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
  let bannerBg = 'bg-[#152A3A]';
  let bannerBorder = 'border-[#223F5A]';
  let bannerIcon = '🔍';
  let entryStatus = '🟡 មិនទាន់ចូល / កំពុងរង់ចាំ (WAITING)';
  let eaStatusColor = 'text-blue-400';
  let eaStatusBg = 'bg-blue-900/30 border-blue-700/50';
  let eaStatusText = 'កំពុងស្កេន (SCANNING)';

  if (state.status !== 'running') {
     bannerTitle = 'ប្រព័ន្ធត្រូវបានផ្អាក (ENGINE PAUSED)';
     bannerColor = 'text-gray-400';
     bannerBg = 'bg-[#1A2333]';
     bannerBorder = 'border-[#2A3441]';
     bannerIcon = '⏸️';
     entryStatus = '⚪ ផ្អាកដំណើរការ (PAUSED)';
     eaStatusColor = 'text-gray-400';
     eaStatusBg = 'bg-gray-800 border-gray-700';
     eaStatusText = 'ផ្អាក (STOPPED)';
  } else if (isCanceled) {
     bannerTitle = \`លុបចោល: \${setup.cancellationReason || 'Virtual Limit ត្រូវបានប៉ះ'} (SETUP CANCELLED)\`;
     bannerColor = 'text-red-400';
     bannerBg = 'bg-[#3A1515]';
     bannerBorder = 'border-[#5A2222]';
     bannerIcon = '🔴';
     entryStatus = '🔴 បរាជ័យ / រកថ្មី (CANCELLED)';
     eaStatusColor = 'text-red-400';
     eaStatusBg = 'bg-red-900/30 border-red-700/50';
     eaStatusText = 'លុបចោល (CANCELLED)';
  } else if (currentStep >= 2 && currentStep <= 4) {
     bannerTitle = 'បញ្ជាក់សញ្ញាណទីផ្សារ (VALIDATING FAST ENTRY PARAMETERS)';
     bannerColor = 'text-yellow-400';
     bannerBg = 'bg-[#3A2A1A]';
     bannerBorder = 'border-[#5A3F22]';
     bannerIcon = '⏳';
     eaStatusColor = 'text-yellow-400';
     eaStatusBg = 'bg-yellow-900/30 border-yellow-700/50';
     eaStatusText = 'កំពុងវិភាគ (ANALYZING)';
  } else if (currentStep === 5 || currentStep === 6) {
     bannerTitle = \`កំណត់តម្លៃ \${setup.direction} \${setup.lockedEntryPrice.toFixed(3)} រួចរាល់ (WAITING FOR PRICE)\`;
     bannerColor = 'text-orange-400';
     bannerBg = 'bg-[#3A1A1A]';
     bannerBorder = 'border-[#5A2F22]';
     bannerIcon = '🔒';
     entryStatus = '🟡 រង់ចាំតម្លៃមកដល់ (PENDING)';
     eaStatusColor = 'text-orange-400';
     eaStatusBg = 'bg-orange-900/30 border-orange-700/50';
     eaStatusText = 'រង់ចាំតម្លៃ (PENDING)';
  } else if (currentStep >= 7 && currentStep <= 10) {
     bannerTitle = \`TRADE \${setup.direction} កំពុងដំណើរការ (MANAGING ACTIVE TRADE)\`;
     bannerColor = 'text-green-400';
     bannerBg = 'bg-[#153A1A]';
     bannerBorder = 'border-[#225A2A]';
     bannerIcon = '🚀';
     entryStatus = '🟢 ចូល Trade រួចរាល់ (EXECUTED)';
     eaStatusColor = 'text-green-400';
     eaStatusBg = 'bg-green-900/30 border-green-700/50';
     eaStatusText = 'កំពុង Trade (ACTIVE)';
  } else if (currentStep === 11) {
     bannerTitle = 'TRADE ត្រូវបានបិទ (TRADE CLOSED - RESETTING)';
     bannerColor = 'text-teal-400';
     bannerBg = 'bg-[#153A3A]';
     bannerBorder = 'border-[#225A5A]';
     bannerIcon = '✅';
     entryStatus = '⚪ បិទរួចរាល់ (CLOSED)';
     eaStatusColor = 'text-teal-400';
     eaStatusBg = 'bg-teal-900/30 border-teal-700/50';
     eaStatusText = 'បានបិទ (CLOSED)';
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
          if (setup.id !== prevSetupId.current) addLog('Liquidity Sweep Detected on M1', 'Setup');
          if (setup.displacementConfirmed && !prevDisp.current) addLog('Displacement Confirmed', 'Setup');
          if (setup.mssLevel > 0 && !prevMss.current) addLog(\`MSS Confirmed at \${setup.mssLevel.toFixed(3)}\`, 'Setup');
          if (setup.lockedEntryPrice > 0 && !prevLock.current) addLog(\`Entry Locked: \${setup.lockedEntryPrice.toFixed(3)}\`, 'Entry');
          if (daraState === 'EXECUTING' && prevDaraState.current !== 'EXECUTING') addLog('Entry Reached - Sending Order...', 'Entry');
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
    let icon = <span className="text-gray-600">🕒</span>;
    let statusText = 'កំពុងរង់ចាំ (WAITING)';
    let statusColor = 'text-gray-500';
    let borderClass = 'border-[#2A3441]';
    let bgClass = 'bg-[#0D1117]';

    if (isCompleted) {
        iconColor = 'text-green-500';
        icon = <span className="font-bold text-sm">✓</span>;
        statusText = 'បញ្ជាក់រួចរាល់ (CONFIRMED)';
        statusColor = 'text-green-500';
        borderClass = 'border-green-500/30';
    } else if (isActive) {
        iconColor = 'text-blue-400';
        icon = <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>;
        statusText = 'កំពុងដំណើរការ (ACTIVE)';
        statusColor = 'text-blue-400';
        borderClass = 'border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]';
        bgClass = 'bg-[#121A2F]';
    } else if (isFailed) {
        iconColor = 'text-red-500';
        icon = <span className="font-bold text-sm">✕</span>;
        statusText = 'បោះបង់ (CANCELLED)';
        statusColor = 'text-red-500';
        borderClass = 'border-red-500/50';
        bgClass = 'bg-[#2F1212]';
    }

    return (
        <div className={\`p-4 rounded-xl border \${borderClass} \${bgClass} flex flex-col justify-between transition-all duration-300 min-h-[120px]\`}>
            <div className="flex items-start gap-3 mb-2">
                <div className={\`mt-1 \${iconColor}\`}>{icon}</div>
                <div>
                    <div className={\`font-bold text-xs \${isActive || isCompleted ? 'text-gray-200' : 'text-gray-400'}\`}>{num}. {titleKh}</div>
                    <div className={\`text-[9px] uppercase tracking-wider \${isActive || isCompleted ? 'text-gray-400' : 'text-gray-600'}\`}>{titleEn}</div>
                </div>
            </div>
            <div className="ml-6 mt-1">
                <div className={\`text-[10px] font-bold mb-1.5 \${statusColor}\`}>{statusText}</div>
                <div className="text-xs text-gray-300 leading-relaxed min-h-[36px]">
                    {children || <span className="text-gray-600">---</span>}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="font-sans max-w-[1300px] mx-auto p-2 md:p-4 space-y-5 bg-[#0B0F19]">
      
      {/* 1. TOP HEADER - EA MONITOR */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl p-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#0B0F19] border border-[#2A3441] rounded-xl flex items-center justify-center shrink-0">
             <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 5 18 3-9h6" />
             </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
               <div className="relative flex h-3 w-3">
                 {state.status === 'running' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                 <span className={\`relative inline-flex rounded-full h-3 w-3 \${state.status === 'running' ? 'bg-green-500' : 'bg-gray-600'}\`}></span>
               </div>
               <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">ផ្ទាំងតាមដាន EA DaRa ផ្ទាល់ (LIVE EA MONITOR)</h2>
            </div>
            <p className="text-gray-400 text-[11px] mt-1">DaRa M1 EA v1.0 — លំហូរវិភាគ: ស្វែងរក Liquidity Sweep លើ M1 ➔ Displacement ➔ MSS ➔ Trade</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
               <span className="bg-[#1A2333] text-gray-400 text-[9px] font-bold px-2 py-0.5 border border-[#2A3441] rounded uppercase">INDEPENDENT EA</span>
               <span className="bg-[#1A2333] text-gray-400 text-[9px] font-bold px-2 py-0.5 border border-[#2A3441] rounded uppercase">មើលទិន្នន័យប៉ុណ្ណោះ (READ-ONLY)</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start xl:items-end gap-2 w-full xl:w-auto mt-2 xl:mt-0">
          <div className="flex gap-2">
              <div className={\`border \${eaStatusBg} \${eaStatusColor} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2\`}>
                 <span className={\`w-2 h-2 rounded-full \${state.status === 'running' ? 'bg-blue-500' : 'bg-gray-500'}\`}></span> ស្ថានភាព EA: {eaStatusText}
              </div>
              <div className="bg-[#0B0F19] border border-[#2A3441] text-gray-400 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                 <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 1 វិនាទីមុន (1s ago)
              </div>
          </div>
          <div className="text-[11px] font-mono flex flex-wrap items-center gap-3 bg-[#0B0F19] border border-[#2A3441] px-3 py-1.5 rounded-lg w-full xl:w-auto">
             <span className="text-yellow-500 font-bold">XAUUSDc</span>
             <span className="text-gray-600 hidden sm:inline">|</span>
             <span className="text-gray-400">Bid: <span className="text-white">{state.livePrice?.bidPrice?.toFixed(3) || '---'}</span></span>
             <span className="text-gray-600 hidden sm:inline">|</span>
             <span className="text-gray-400">Ask: <span className="text-white">{state.livePrice?.askPrice?.toFixed(3) || '---'}</span></span>
             <span className="text-gray-600 hidden sm:inline">|</span>
             <span className="text-gray-400">Spread: <span className="text-blue-400">{state.livePrice?.spread || '---'} pts</span></span>
          </div>
        </div>
      </div>

      {/* 2. EA HEARTBEAT STATE */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl shadow-lg">
         <div className="flex justify-between items-center p-4 border-b border-[#2A3441]">
            <h3 className="text-white font-bold text-[13px] flex items-center gap-2 uppercase tracking-wide">
               <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
               ការបញ្ជាក់ដំណើរការ EA ជាក់ស្តែង (START CONFIRMED & EA HEARTBEAT STATE)
            </h3>
            <span className={\`text-[10px] font-bold px-3 py-1.5 rounded border \${state.status === 'running' ? 'bg-[#0B3B24] border-[#166534] text-green-400' : 'bg-[#1A2333] border-[#2A3441] text-gray-500'}\`}>
               EA RUNNING = {state.status === 'running' ? 'YES (កំពុងរត់)' : 'NO (ផ្អាក)'}
            </span>
         </div>
         <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'START Request Time:', val: state.startConfirmedTime ? new Date(state.startConfirmedTime).toLocaleTimeString() : '---', isMono: true },
              { label: 'START Confirmed Time:', val: state.startConfirmedTime ? new Date(state.startConfirmedTime).toLocaleTimeString() : '---', isMono: true },
              { label: 'EA Heartbeat:', val: state.status === 'running' ? '8 វិនាទីមុន (8s ago)' : '---', isBlue: true },
              { label: 'រយៈពេលដំណើរការ (Duration):', val: getDuration(), isMono: false },
              { label: 'ស្ថានភាពតភ្ជាប់ (Connection):', val: '🟢 ល្អប្រពៃ (HEALTHY)', isGreen: true },
              { label: 'Last Backend Sync:', val: \`\${new Date().toLocaleTimeString()}\`, isMono: true }
            ].map((d, i) => (
              <div key={i} className="bg-[#0D1117] border border-[#2A3441] rounded-xl p-3 flex flex-col justify-center items-center text-center h-[80px]">
                 <div className="text-[10px] text-gray-500 mb-1">{d.label}</div>
                 <div className={\`text-xs font-bold \${d.isMono ? 'font-mono text-gray-300' : d.isBlue ? 'text-teal-400' : d.isGreen ? 'text-green-500' : 'text-gray-300'}\`}>
                   {d.val}
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* 3. CURRENT STATUS BANNER */}
      <div className={\`\${bannerBg} border \${bannerBorder} rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300 shadow-lg\`}>
         <div>
            <div className="text-orange-400 font-bold text-[11px] mb-2 flex items-center gap-2 uppercase tracking-wide">
               📌 មូលហេតុដែលកំពុងរង់ចាំ & ដំណាក់កាលវិភាគ
            </div>
            <div className={\`\${bannerColor} font-bold text-lg md:text-xl uppercase flex items-center gap-3\`}>
               <span>{bannerIcon}</span> {bannerTitle}
            </div>
         </div>
         <div className="bg-[#121826] border border-[#2A3441] px-5 py-3 rounded-xl flex flex-col items-center min-w-[280px]">
            <div className="text-gray-400 text-[11px] mb-1 uppercase tracking-wider">ស្ថានភាពចូល Trade:</div>
            <div className="text-gray-200 text-xs md:text-sm font-bold">{entryStatus}</div>
         </div>
      </div>

      {/* 4. SETUP FLOW (DaRa 11 STEPS GRID) */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl shadow-lg">
         <div className="p-4 border-b border-[#2A3441] flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            <h3 className="text-white font-bold text-[13px] uppercase tracking-wide">លំហូរតាមដាន DaRa (DaRa SETUP FLOW)</h3>
         </div>
         <div className="p-5 md:p-6">
            
            {/* ROW 1 (4 Steps) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <FlowCard num="①" titleKh="កំពុងស្កេនទីផ្សារ M1" titleEn="SCANNING" stepState={getStepState(1)}>
                  {currentStep >= 1 ? <div className="text-blue-400">ស្កេនរក Liquidity Sweep...</div> : null}
               </FlowCard>
               <FlowCard num="②" titleKh="ការបោសយកសាច់ប្រាក់" titleEn="LIQUIDITY SWEEP" stepState={getStepState(2)}>
                  {setup?.sweepLevel > 0 && <div>Sweep Price: <span className="font-mono text-white">{setup.sweepLevel.toFixed(3)}</span><br/>ទិសដៅ: <span className={isBuy ? 'text-green-400' : 'text-red-400'}>{setup.direction}</span></div>}
               </FlowCard>
               <FlowCard num="③" titleKh="ចលនាតម្លៃខ្លាំង" titleEn="DISPLACEMENT" stepState={getStepState(3)}>
                  {setup?.displacementConfirmed && <div className="text-green-400">មានចលនាខ្លាំង (Confirmed)</div>}
               </FlowCard>
               <FlowCard num="④" titleKh="ការបំបែករចនាសម្ព័ន្ធ" titleEn="MSS" stepState={getStepState(4)}>
                  {setup?.mssLevel > 0 && <div>MSS Level: <span className="font-mono text-white">{setup.mssLevel.toFixed(3)}</span></div>}
               </FlowCard>
            </div>

            <div className="flex justify-center my-3"><svg className="w-5 h-5 text-[#2A3441]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></div>

            {/* ROW 2 (4 Steps) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <FlowCard num="⑤" titleKh="បានចាក់សោ ENTRY" titleEn="ENTRY LOCKED" stepState={getStepState(5)}>
                  {setup?.lockedEntryPrice > 0 && <div>Locked Entry: <span className="font-mono text-yellow-400">{setup.lockedEntryPrice.toFixed(3)}</span><br/><span className="text-[10px] text-gray-500">Immutable Price</span></div>}
               </FlowCard>
               <FlowCard num="⑥" titleKh="កំពុងរង់ចាំ ENTRY" titleEn="WAITING FOR ENTRY" stepState={getStepState(6)}>
                  {currentStep >= 6 && setup?.lockedEntryPrice > 0 && <div>បច្ចុប្បន្ន: <span className="font-mono">{state.livePrice?.goldPrice?.toFixed(3) || '---'}</span><br/>គម្លាត: <span className="font-mono text-blue-400">{state.livePrice?.goldPrice ? Math.abs(state.livePrice.goldPrice - setup.lockedEntryPrice).toFixed(3) : '---'} pts</span></div>}
               </FlowCard>
               <FlowCard num="⑦" titleKh="តម្លៃបានដល់ ENTRY" titleEn="ENTRY REACHED" stepState={getStepState(7)}>
                  {currentStep >= 7 && <div className="text-green-400">តម្លៃប៉ះ Entry រួចរាល់!</div>}
               </FlowCard>
               <FlowCard num="⑧" titleKh="កំពុងបញ្ជូន ORDER" titleEn="EXECUTING" stepState={getStepState(8)}>
                  {currentStep >= 8 && <div className="text-blue-400 animate-pulse">Sending to MetaApi...</div>}
               </FlowCard>
            </div>

            <div className="flex justify-center my-3"><svg className="w-5 h-5 text-[#2A3441]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></div>

            {/* ROW 3 (3 Steps) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
               <FlowCard num="⑨" titleKh="កំពុងមាន TRADE" titleEn="TRADE ACTIVE" stepState={getStepState(9)}>
                  {activeTrade && <div>Lot: {activeTrade.lot} | <span className={activeTrade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>{activeTrade.side}</span><br/>Entry: <span className="font-mono">{activeTrade.entryPrice?.toFixed(3)}</span></div>}
               </FlowCard>
               <FlowCard num="⑩" titleKh="កំពុងរំកិល SL" titleEn="TRAILING SL" stepState={getStepState(10)}>
                  {activeTrade && currentStep >= 10 && <div>SL បច្ចុប្បន្ន: <span className="text-yellow-400 font-mono">{activeTrade.sl?.toFixed(3)}</span><br/>P/L: <span className={\`font-mono \${activeTrade.profit && activeTrade.profit >= 0 ? 'text-green-400' : 'text-red-400'}\`}>\${activeTrade.profit?.toFixed(2) || '0.00'}</span></div>}
               </FlowCard>
               <FlowCard num="⑪" titleKh="TRADE បានបិទ" titleEn="TRADE CLOSED" stepState={getStepState(11)}>
                  {currentStep === 11 && <div className="text-gray-400">បិទរួចរាល់ ត្រៀមស្កេនថ្មី។</div>}
               </FlowCard>
            </div>

         </div>
      </div>

      {/* 5. SYSTEM HEALTH MATRIX */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl shadow-lg">
         <div className="p-4 border-b border-[#2A3441] flex justify-between items-center">
            <h3 className="text-white font-bold text-[13px] flex items-center gap-2 uppercase tracking-wide">
               <span className="text-red-500">🛡️</span> សុខភាពប្រព័ន្ធ & ការគ្រប់គ្រងហានិភ័យ (SYSTEM HEALTH MATRIX)
            </h3>
            <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">EXNESS VPS • PORT 3000</span>
         </div>
         
         <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
               {[
                 { label: 'MT5', val: 'ភ្ជាប់ (CONNECTED)', icon: '📡' },
                 { label: 'EA BRIDGE', val: 'ដំណើរការ (ACTIVE)', icon: '🔌' },
                 { label: 'VPS', val: 'អនឡាញ (ONLINE)', icon: '🖥️' },
                 { label: 'តម្លៃទីផ្សារ', val: 'ផ្ទាល់ (LIVE)', icon: '📈' },
                 { label: 'ភាពយឺតយ៉ាវ', val: '15 ms (លឿន)', icon: '⚡', isBlue: true },
                 { label: 'ព័ត៌មាន NEWS', val: 'សុវត្ថិភាព (SAFE)', icon: '📰' },
                 { label: 'RISK GUARD', val: 'កំពុងការពារ (ACTIVE)', icon: '🛡️' }
               ].map((item, i) => (
                 <div key={i} className="bg-[#0D1117] border border-[#2A3441] rounded-xl p-3 flex flex-col justify-center">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                       <span>{item.icon}</span> {item.label}
                    </div>
                    <div className={\`text-xs font-bold flex items-center gap-1.5 \${item.isBlue ? 'text-blue-400' : 'text-green-500'}\`}>
                       {!item.isBlue && <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                       {item.val}
                    </div>
                 </div>
               ))}
            </div>

            <div className="bg-[#0B0F19] border border-[#2A3441] rounded-xl p-4">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-gray-300 text-[11px] font-bold flex items-center gap-2 uppercase tracking-widest">
                     <span className="text-yellow-500">⚡⚡</span> លម្អិតពេលវេលា & ភាពយឺតយ៉ាវនៃទិន្នន័យ (REAL-TIME DATA LATENCY BREAKDOWN)
                  </h4>
                  <span className="text-green-400 border border-green-500/30 bg-green-900/20 px-2 py-0.5 rounded text-[9px] font-bold">
                     ផ្សាយផ្ទាល់ពី MT5 (LIVE MT5 FEED)
                  </span>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { l: 'ម៉ោង Tick MT5:', v: \`\${new Date().toISOString().split('T')[0]} \${new Date().toLocaleTimeString('en-GB')}.145...\` },
                    { l: 'ម៉ោង Backend ទទួលបាន:', v: \`\${new Date().toISOString().split('T')[0]} \${new Date().toLocaleTimeString('en-GB')}.145...\` },
                    { l: 'ម៉ោងវិភាគ DaRa:', v: \`\${new Date().toISOString().split('T')[0]} \${new Date().toLocaleTimeString('en-GB')}.150...\` },
                    { l: 'អាយុកាល Tick ចុងក្រោយ:', v: '1.3s', isGreen: true },
                    { l: 'ភាពយឺតយ៉ាវសរុប:', v: '15 ms', isBlue: true }
                  ].map((d, i) => (
                     <div key={i} className="bg-[#121826] border border-[#2A3441] p-3 rounded-lg">
                        <div className="text-[10px] text-gray-500 mb-1">{d.l}</div>
                        <div className={\`text-[11px] font-mono font-bold \${d.isGreen ? 'text-green-400' : d.isBlue ? 'text-blue-400' : 'text-gray-300'}\`}>{d.v}</div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* 6. AUDIT TRAIL */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl shadow-lg">
         <div className="p-4 border-b border-[#2A3441] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-gray-300 font-bold text-[13px] flex items-center gap-2 uppercase tracking-wide">
               <span className="text-emerald-400">{'>_'}</span> កំណត់ត្រាការវិភាគជាក់ស្តែង (ANALYSIS AUDIT TRAIL)
            </h3>
            <div className="flex items-center gap-2 text-xs">
               {['ALL', 'Setup', 'Entry', 'Trade', 'System'].map(f => (
                 <button 
                   key={f}
                   onClick={() => setFilter(f.toUpperCase())}
                   className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors \${filter === f.toUpperCase() ? 'bg-[#30363D] text-white border border-[#4B5563]' : 'bg-[#0D1117] text-gray-500 border border-[#2A3441] hover:text-gray-300'}\`}
                 >
                   {f === 'ALL' ? 'ទាំងអស់ (All)' : f}
                 </button>
               ))}
            </div>
         </div>
         
         <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
               <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                  <input type="text" placeholder="ស្វែងរក Logs..." className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg py-2 pl-9 pr-4 text-xs text-gray-300 focus:outline-none focus:border-blue-500" />
               </div>
               <button className="bg-[#21262D] border border-[#30363D] px-4 py-2 rounded-lg text-gray-300 text-xs hover:bg-[#30363D] flex items-center gap-2 transition-colors">
                  📋 ចម្លង
               </button>
            </div>

            <div className="bg-[#010409] border border-[#30363D] rounded-xl p-3 h-[250px] overflow-y-auto font-mono text-[11px]">
               {logs.filter(l => filter === 'ALL' || l.type.toUpperCase() === filter).map((log, i) => (
                 <div key={i} className="py-1.5 flex gap-3 hover:bg-[#161B22] px-2 rounded cursor-default border-b border-[#30363D]/30 last:border-0">
                    <span className="text-gray-500 shrink-0">[{log.time}]</span>
                    <span className={\`\${log.msg.includes('Cancel') ? 'text-red-400' : log.msg.includes('Executed') || log.msg.includes('Closed') ? 'text-green-400' : log.msg.includes('Locked') ? 'text-yellow-400' : 'text-gray-300'}\`}>
                      {log.msg}
                    </span>
                 </div>
               ))}
               {logs.length === 0 && (
                 <div className="text-gray-600 text-center mt-10 italic">ពុំទាន់មានកំណត់ត្រាថ្មីទេ...</div>
               )}
            </div>
         </div>
      </div>

    </div>
  );
};
`

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log('Done writing Exact Structure Match for DaRa');
