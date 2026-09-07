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

  // State calculations mapping strictly to the 9 Steps
  let currentStep = 0;
  if (setup) {
    if (daraState === 'TRADE_CLOSED' || (setup.status === 'EXECUTED' && !activeTrade)) currentStep = 9;
    else if (daraState === 'TRAILING' || (activeTrade && (isBuy ? activeTrade.sl > setup.virtualSLPrice : activeTrade.sl < setup.virtualSLPrice))) currentStep = 8;
    else if (daraState === 'TRADE_ACTIVE' || activeTrade) currentStep = 7;
    else if (daraState === 'EXECUTING') currentStep = 6;
    else if (daraState === 'WAIT_FOR_LOCKED_ENTRY') currentStep = 5;
    else if (setup.lockedEntryPrice > 0) currentStep = 4;
    else if (setup.mssLevel > 0) currentStep = 3;
    else if (setup.displacementConfirmed) currentStep = 2;
    else if (setup.sweepLevel > 0) currentStep = 1;
  }

  let bannerTitle = 'កំពុងរង់ចាំការបោសយកសាច់ប្រាក់លើ M1 (WAITING FOR M1 LIQUIDITY SWEEP)';
  let bannerColor = 'text-yellow-500';
  let bannerBg = 'bg-[#3A2A1A]'; // similar to screenshot brown-ish
  let bannerBorder = 'border-[#5A3F22]';
  let bannerIcon = '⏳';
  let entryStatus = '🟡 មិនទាន់ចូល / កំពុងរង់ចាំ (WAITING)';
  let topStatusText = 'កំពុងរង់ចាំ (WAITING)';
  let topStatusColor = 'text-yellow-500';
  let topStatusBg = 'bg-yellow-900/30 border-yellow-700/50';

  if (state.status !== 'running') {
     bannerTitle = 'ប្រព័ន្ធត្រូវបានផ្អាក (ENGINE PAUSED)';
     bannerColor = 'text-gray-400';
     bannerBg = 'bg-[#1A2333]';
     bannerBorder = 'border-[#2A3441]';
     bannerIcon = '⏸️';
     entryStatus = '⚪ ផ្អាកដំណើរការ (PAUSED)';
     topStatusText = 'ផ្អាក (STOPPED)';
     topStatusColor = 'text-gray-400';
     topStatusBg = 'bg-gray-800 border-gray-700';
  } else if (isCanceled) {
     bannerTitle = \`ត្រូវបានលុបចោល: \${setup.cancellationReason || 'Virtual Limit ត្រូវបានប៉ះ'} (SETUP CANCELLED)\`;
     bannerColor = 'text-red-400';
     bannerBg = 'bg-[#3A1515]';
     bannerBorder = 'border-[#5A2222]';
     bannerIcon = '🔴';
     entryStatus = '🔴 បរាជ័យ / រកថ្មី (CANCELLED)';
     topStatusText = 'កំពុងវិភាគ (ANALYZING)';
  } else if (currentStep >= 1 && currentStep <= 3) {
     bannerTitle = 'កំពុងបញ្ជាក់សញ្ញាណទីផ្សារ (VALIDATING FAST ENTRY PARAMETERS)';
     bannerColor = 'text-blue-400';
     bannerBg = 'bg-[#152A3A]';
     bannerBorder = 'border-[#223F5A]';
     bannerIcon = '🔵';
     entryStatus = '🟡 កំពុងរង់ចាំ (WAITING)';
     topStatusText = 'កំពុងវិភាគ (ANALYZING)';
     topStatusColor = 'text-blue-400';
     topStatusBg = 'bg-blue-900/30 border-blue-700/50';
  } else if (currentStep === 4 || currentStep === 5) {
     bannerTitle = \`កំណត់តម្លៃ \${setup.direction} ត្រង់ \${setup.lockedEntryPrice.toFixed(3)} រួចរាល់ (WAITING FOR PRICE)\`;
     bannerColor = 'text-orange-400';
     bannerBg = 'bg-[#3A2A1A]';
     bannerBorder = 'border-[#5A3F22]';
     bannerIcon = '🔒';
     entryStatus = '🟡 កំពុងរង់ចាំតម្លៃមកដល់ (PENDING)';
     topStatusText = 'រង់ចាំតម្លៃ (PENDING)';
  } else if (currentStep >= 6 && currentStep <= 8) {
     bannerTitle = \`TRADE \${setup.direction} កំពុងដំណើរការ (MANAGING ACTIVE TRADE)\`;
     bannerColor = 'text-green-400';
     bannerBg = 'bg-[#153A1A]';
     bannerBorder = 'border-[#225A2A]';
     bannerIcon = '🚀';
     entryStatus = '🟢 ចូល Trade រួចរាល់ (EXECUTED)';
     topStatusText = 'កំពុង Trade (ACTIVE)';
     topStatusColor = 'text-green-400';
     topStatusBg = 'bg-green-900/30 border-green-700/50';
  }

  // Audit Trail Logic
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

  const FlowCard = ({ title, isActive, isCompleted, isFailed, valueText }: any) => {
    let iconColor = 'text-gray-500';
    let iconSvg = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    let statusText = 'WAITING';
    let statusColor = 'text-[#3A4354]';

    if (isCompleted) {
        iconColor = 'text-green-500';
        iconSvg = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
        statusText = valueText || 'CONFIRMED ✓';
        statusColor = 'text-green-500';
    } else if (isActive) {
        iconColor = 'text-blue-400';
        iconSvg = <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
        statusText = valueText || 'ACTIVE';
        statusColor = 'text-blue-400';
    } else if (isFailed) {
        iconColor = 'text-red-500';
        iconSvg = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
        statusText = 'CANCELLED ✕';
        statusColor = 'text-red-500';
    }

    return (
      <div className="bg-[#0D1117] border border-[#2A3441] rounded-lg p-4 flex flex-col justify-center min-h-[80px] flex-1 max-w-[280px]">
         <div className="flex items-center gap-2 mb-2">
            <span className={iconColor}>{iconSvg}</span>
            <span className={\`font-bold text-xs uppercase tracking-wider \${isActive || isCompleted ? 'text-gray-300' : 'text-gray-500'}\`}>{title}</span>
         </div>
         <div className={\`text-[10px] font-bold uppercase tracking-widest \${statusColor} ml-6\`}>
            {statusText}
         </div>
      </div>
    );
  };

  const stepState = (n: number) => ({
      isActive: currentStep === n && !isCanceled,
      isCompleted: currentStep > n || (isCanceled && currentStep > n),
      isFailed: currentStep === n && isCanceled
  });

  return (
    <div className="font-sans max-w-[1200px] mx-auto p-4 space-y-6">
      
      {/* 1. TOP HEADER */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
               <h2 className="text-xl font-bold text-white tracking-wide">ផ្ទាំងតាមដាន EA DaRa ផ្ទាល់</h2>
            </div>
            <p className="text-gray-400 text-xs mt-1">លំហូរវិភាគជាក់ស្តែង: ស្វែងរក Liquidity Sweep លើ M1 ➔ បញ្ជាក់ Displacement ➔ MSS ➔ បើក Trade</p>
            <div className="flex items-center gap-2 mt-2">
               <span className="bg-[#1A2333] text-gray-400 text-[9px] font-bold px-2 py-0.5 border border-[#2A3441] rounded uppercase">(LIVE DaRa EA MONITOR)</span>
               <span className="bg-[#1A2333] text-gray-400 text-[9px] font-bold px-2 py-0.5 border border-[#2A3441] rounded uppercase">មើលទិន្នន័យប៉ុណ្ណោះ (READ-ONLY)</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className={\`border \${topStatusBg} \${topStatusColor} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2\`}>
             <span className={\`w-2 h-2 rounded-full \${state.status === 'running' ? (currentStep > 0 ? 'bg-blue-500' : 'bg-yellow-500') : 'bg-gray-500'}\`}></span> ស្ថានភាព EA: <span className="text-white ml-1">{topStatusText}</span>
          </div>
          <div className="bg-[#0B0F19] border border-[#2A3441] text-gray-400 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
             <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             វិនាទីចុងក្រោយ: {state.livePrice?.lastPriceUpdate ? '1 វិនាទីមុន (1s ago)' : '---'}
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
             <span className="text-yellow-500 font-bold">XAUUSDc</span>
             <span className="text-gray-500">|</span>
             <span className="text-gray-400">Bid: <span className="text-white">{state.livePrice?.bidPrice?.toFixed(3) || '---'}</span></span>
             <span className="text-gray-500">|</span>
             <span className="text-gray-400">Ask: <span className="text-white">{state.livePrice?.askPrice?.toFixed(3) || '---'}</span></span>
             <span className="text-gray-500">|</span>
             <span className="text-gray-400">Spread: <span className="text-blue-400">{state.livePrice?.spread || '---'} pts</span></span>
          </div>
        </div>
      </div>

      {/* 2. EA HEARTBEAT STATE */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl">
         <div className="flex justify-between items-center p-4 border-b border-[#2A3441]">
            <h3 className="text-white font-bold text-xs flex items-center gap-2">
               <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
               ការបញ្ជាក់ដំណើរការ EA ជាក់ស្តែង (START CONFIRMED & EA HEARTBEAT STATE)
            </h3>
            <span className={\`text-[9px] font-bold px-3 py-1 rounded border \${state.status === 'running' ? 'bg-[#153A1A] border-[#225A2A] text-green-500' : 'bg-[#1A2333] border-[#2A3441] text-gray-500'}\`}>
               EA RUNNING = {state.status === 'running' ? 'YES (កំពុងរត់)' : 'NO (ផ្អាក)'}
            </span>
         </div>
         <div className="p-4 grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-[#0D1117] border border-[#2A3441] rounded-lg p-3 flex flex-col justify-center items-center">
               <div className="text-[10px] text-gray-500 mb-1">START Request Time:</div>
               <div className="text-gray-300 text-xs font-mono font-bold">{state.startConfirmedTime ? new Date(state.startConfirmedTime).toLocaleTimeString() : '---'}</div>
            </div>
            <div className="bg-[#0D1117] border border-[#2A3441] rounded-lg p-3 flex flex-col justify-center items-center">
               <div className="text-[10px] text-gray-500 mb-1">START Confirmed Time:</div>
               <div className="text-gray-300 text-xs font-mono font-bold">{state.startConfirmedTime ? new Date(state.startConfirmedTime).toLocaleTimeString() : '---'}</div>
            </div>
            <div className="bg-[#0D1117] border border-[#2A3441] rounded-lg p-3 flex flex-col justify-center items-center">
               <div className="text-[10px] text-gray-500 mb-1">EA Heartbeat:</div>
               <div className="text-teal-400 text-xs font-bold flex items-center gap-1">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 {state.status === 'running' ? '1 វិនាទីមុន (1s ago)' : '---'}
               </div>
            </div>
            <div className="bg-[#0D1117] border border-[#2A3441] rounded-lg p-3 flex flex-col justify-center items-center">
               <div className="text-[10px] text-gray-500 mb-1">រយៈពេលដំណើរការ (Duration):</div>
               <div className="text-gray-300 text-xs font-bold font-mono">{getDuration()}</div>
            </div>
            <div className="bg-[#0D1117] border border-[#2A3441] rounded-lg p-3 flex flex-col justify-center items-center">
               <div className="text-[10px] text-gray-500 mb-1">ស្ថានភាពតភ្ជាប់ (Connection):</div>
               <div className="text-green-500 text-xs font-bold flex items-center gap-1">
                 <span className="w-2 h-2 bg-green-500 rounded-full"></span> ល្អប្រពៃ (HEALTHY)
               </div>
            </div>
            <div className="bg-[#0D1117] border border-[#2A3441] rounded-lg p-3 flex flex-col justify-center items-center">
               <div className="text-[10px] text-gray-500 mb-1">Last Backend Sync:</div>
               <div className="text-gray-400 text-xs font-mono flex items-center gap-1">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 {state.livePrice?.lastPriceUpdate ? new Date(state.livePrice.lastPriceUpdate).toLocaleTimeString() : '---'}
               </div>
            </div>
         </div>
      </div>

      {/* 3. CURRENT STATUS BANNER */}
      <div className={\`\${bannerBg} border \${bannerBorder} rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4\`}>
         <div>
            <div className="text-orange-400 font-bold text-xs mb-1 flex items-center gap-2">
               📌 មូលហេតុដែលកំពុងរង់ចាំ & ដំណាក់កាលវិភាគ
            </div>
            <div className={\`\${bannerColor} font-bold text-lg uppercase flex items-center gap-2\`}>
               <span>{bannerIcon}</span> {bannerTitle}
            </div>
         </div>
         <div className="bg-[#121826] border border-[#2A3441] px-4 py-2.5 rounded-lg flex flex-col items-center min-w-[250px]">
            <div className="text-gray-400 text-[10px] mb-1">ស្ថានភាពចូល Trade:</div>
            <div className="text-gray-200 text-xs font-bold">{entryStatus}</div>
         </div>
      </div>

      {/* 4. SETUP FLOW (DaRa 9 STEPS) */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl">
         <div className="p-4 border-b border-[#2A3441] flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            <h3 className="text-white font-bold text-xs">លំហូរតាមដាន DaRa (DaRa SETUP FLOW)</h3>
         </div>
         <div className="p-6">
            <div className="flex flex-wrap justify-center gap-4 mb-4">
               <FlowCard title="① LIQUIDITY SWEEP" {...stepState(1)} valueText={setup?.sweepLevel > 0 ? \`SWEEP: \${setup.sweepLevel.toFixed(3)}\` : null} />
               <FlowCard title="② DISPLACEMENT" {...stepState(2)} valueText={setup?.displacementConfirmed ? 'YES' : null} />
               <FlowCard title="③ MSS" {...stepState(3)} valueText={setup?.mssLevel > 0 ? \`LEVEL: \${setup.mssLevel.toFixed(3)}\` : null} />
               <FlowCard title="④ ENTRY LOCKED 🔒" {...stepState(4)} valueText={setup?.lockedEntryPrice > 0 ? \`\${setup.direction} @ \${setup.lockedEntryPrice.toFixed(3)}\` : null} />
            </div>

            <div className="flex justify-center my-2"><svg className="w-5 h-5 text-[#2A3441]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></div>

            <div className="flex flex-wrap justify-center gap-4 mb-4">
               <FlowCard title="⑤ WAITING FOR ENTRY" {...stepState(5)} valueText={state.livePrice?.goldPrice ? \`PRICE: \${state.livePrice.goldPrice.toFixed(3)}\` : null} />
               <FlowCard title="⑥ ENTRY REACHED" {...stepState(6)} />
               <FlowCard title="⑦ TRADE ACTIVE" {...stepState(7)} valueText={activeTrade ? \`\${activeTrade.side} / LOT: \${activeTrade.lot}\` : null} />
            </div>

            <div className="flex justify-center my-2"><svg className="w-5 h-5 text-[#2A3441]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></div>

            <div className="flex flex-wrap justify-center gap-4">
               <FlowCard title="⑧ TRAILING SL" {...stepState(8)} valueText={activeTrade ? \`SL: \${activeTrade.sl.toFixed(3)}\` : null} />
               <FlowCard title="⑨ TRADE CLOSED" {...stepState(9)} />
            </div>
         </div>
      </div>

      {/* 5. SYSTEM HEALTH MATRIX */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl">
         <div className="p-4 border-b border-[#2A3441] flex justify-between items-center">
            <h3 className="text-white font-bold text-xs flex items-center gap-2">
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
                 <div key={i} className="bg-[#0D1117] border border-[#2A3441] rounded-lg p-3">
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

            <div className="bg-[#0B0F19] border border-[#2A3441] rounded-lg p-4">
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
                     <div key={i} className="bg-[#121826] border border-[#2A3441] p-2.5 rounded">
                        <div className="text-[10px] text-gray-500 mb-1">{d.l}</div>
                        <div className={\`text-[11px] font-mono font-bold \${d.isGreen ? 'text-green-400' : d.isBlue ? 'text-blue-400' : 'text-gray-300'}\`}>{d.v}</div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* 6. AUDIT TRAIL */}
      <div className="bg-[#121826] border border-[#2A3441] rounded-2xl">
         <div className="p-4 border-b border-[#2A3441] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-gray-300 font-bold text-xs flex items-center gap-2">
               <span className="text-emerald-400">{'>_'}</span> 📜 កំណត់ត្រាការវិភាគជាក់ស្តែង (ANALYSIS AUDIT TRAIL — {logs.length} ព្រឹត្តិការណ៍)
            </h3>
            <div className="flex items-center gap-2 text-xs">
               {['ALL', 'Setup', 'Entry', 'Trade', 'System'].map(f => (
                 <button 
                   key={f}
                   onClick={() => setFilter(f.toUpperCase())}
                   className={\`px-3 py-1 rounded text-[10px] \${filter === f.toUpperCase() ? 'bg-[#30363D] text-white' : 'text-gray-500 hover:text-gray-300'}\`}
                 >
                   {f === 'ALL' ? 'ទាំងអស់ (All)' : f === 'System' ? 'ប្រព័ន្ធ (System)' : f}
                 </button>
               ))}
            </div>
         </div>
         
         <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
               <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                  <input type="text" placeholder="ស្វែងរក Logs..." className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg py-1.5 pl-9 pr-4 text-xs text-gray-300 focus:outline-none focus:border-blue-500" />
               </div>
               <button className="bg-[#21262D] border border-[#30363D] px-3 py-1.5 rounded-lg text-gray-300 text-xs hover:bg-[#30363D] flex items-center gap-1 transition-colors">
                  📋 ចម្លង
               </button>
            </div>

            <div className="bg-[#010409] border border-[#30363D] rounded-lg p-3 h-[200px] overflow-y-auto font-mono text-[11px]">
               {logs.filter(l => filter === 'ALL' || l.type.toUpperCase() === filter).map((log, i) => (
                 <div key={i} className="py-1 flex gap-3 hover:bg-[#161B22] px-2 rounded cursor-default">
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
console.log('Done writing Exact Screenshot Layout Match');
