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
  const dirColor = isBuy ? 'text-green-400' : 'text-red-400';
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

  // Activity Banner Logic
  let activityTitle = '⏸️ EA WAITING / IDLE';
  let activitySub = 'Press START to initiate scanning';
  let activityColor = 'text-slate-400';

  if (state.status === 'running') {
     if (!setup) {
         activityTitle = '🟢 EA RUNNING';
         activitySub = 'Scanning M1 Market for Liquidity Sweep...';
         activityColor = 'text-green-400';
     } else if (isCanceled) {
         activityTitle = '🔴 SETUP CANCELLED';
         activitySub = setup.cancellationReason || 'Virtual Limits Reached';
         activityColor = 'text-red-400';
     } else if (currentStep >= 1 && currentStep <= 3) {
         activityTitle = '🔵 SETUP DETECTED';
         activitySub = 'Validating Fast Entry Parameters...';
         activityColor = 'text-blue-400';
     } else if (currentStep === 4 || currentStep === 5) {
         activityTitle = '🔒 ENTRY LOCKED';
         activitySub = 'Waiting for Price to reach Entry...';
         activityColor = 'text-yellow-400';
     } else if (currentStep >= 6 && currentStep <= 8) {
         activityTitle = '🚀 TRADE ACTIVE';
         activitySub = \`Managing \${setup.direction} position...\`;
         activityColor = 'text-green-400';
     } else if (currentStep === 9) {
         activityTitle = '✅ TRADE CLOSED';
         activitySub = 'Resetting to scan for new setup...';
         activityColor = 'text-slate-400';
     }
  }

  // Audit Trail Logic
  const [logs, setLogs] = useState<{time: string, msg: string, type: 'SETUP'|'TRADE'|'SYSTEM'}[]>([]);
  const [filter, setFilter] = useState<'ALL'|'SETUP'|'TRADE'|'SYSTEM'>('ALL');
  
  const prevIsRunning = useRef(state.status === 'running');
  const prevSetupId = useRef(setup?.id);
  const prevDisp = useRef(setup?.displacementConfirmed);
  const prevMss = useRef(setup?.mssLevel);
  const prevLock = useRef(setup?.lockedEntryPrice);
  const prevDaraState = useRef(daraState);
  const prevSetupStatus = useRef(setup?.status);

  useEffect(() => {
      const time = new Date().toLocaleTimeString('en-GB');
      const addLog = (msg: string, type: 'SETUP'|'TRADE'|'SYSTEM') => {
          setLogs(prev => [{time, msg, type}, ...prev].slice(0, 50));
      };

      const isRunning = state.status === 'running';
      if (isRunning && !prevIsRunning.current) addLog('🔍 M1 Market Scanning Started', 'SYSTEM');
      if (!isRunning && prevIsRunning.current) addLog('⏸️ Engine Stopped', 'SYSTEM');
      prevIsRunning.current = isRunning;

      if (setup) {
          if (setup.id !== prevSetupId.current) addLog('💧 Liquidity Sweep Detected', 'SETUP');
          if (setup.displacementConfirmed && !prevDisp.current) addLog('📈 Displacement Confirmed', 'SETUP');
          if (setup.mssLevel > 0 && !prevMss.current) addLog('⚡ MSS Confirmed', 'SETUP');
          if (setup.lockedEntryPrice > 0 && !prevLock.current) addLog(\`🔒 Entry Locked: \${setup.lockedEntryPrice.toFixed(3)}\`, 'SETUP');
          
          if (daraState === 'WAIT_FOR_LOCKED_ENTRY' && prevDaraState.current !== 'WAIT_FOR_LOCKED_ENTRY') addLog('⏳ Waiting For Entry', 'SETUP');
          if (daraState === 'EXECUTING' && prevDaraState.current !== 'EXECUTING') addLog('🎯 Entry Reached - Executing...', 'TRADE');
          if (daraState === 'TRADE_ACTIVE' && prevDaraState.current !== 'TRADE_ACTIVE') addLog(\`🚀 \${setup.direction} Executed\`, 'TRADE');
          if (daraState === 'TRAILING' && prevDaraState.current !== 'TRAILING') addLog('📈 Trailing SL Activated', 'TRADE');
          if (daraState === 'TRADE_CLOSED' && prevDaraState.current !== 'TRADE_CLOSED') addLog('✅ Trade Closed', 'TRADE');
          if (setup.status === 'CANCELED' && prevSetupStatus.current !== 'CANCELED') addLog(\`❌ Setup Cancelled: \${setup.cancellationReason}\`, 'SETUP');
      }

      prevSetupId.current = setup?.id;
      prevDisp.current = setup?.displacementConfirmed;
      prevMss.current = setup?.mssLevel;
      prevLock.current = setup?.lockedEntryPrice;
      prevDaraState.current = daraState;
      prevSetupStatus.current = setup?.status;

  }, [state.status, setup, daraState]);

  const getCardProps = (n: number) => ({
      isCompleted: currentStep > n || (isCanceled && currentStep > n),
      isActive: currentStep === n && !isCanceled,
      isFailed: currentStep === n && isCanceled,
      isWaiting: currentStep < n
  });

  const FlowCard = ({ num, title, props, children, defaultStatus = 'WAITING' }: any) => {
      const { isCompleted, isActive, isFailed, isWaiting } = props;
      
      let borderClass = 'border-slate-800/80';
      let bgClass = 'bg-[#131b2c]';
      let icon = <span className="text-slate-600 text-xs">○</span>;
      let statusText = defaultStatus;
      let statusClass = 'text-slate-600';

      if (isCompleted) {
          borderClass = 'border-green-500/30';
          icon = <span className="text-green-500 font-bold">✓</span>;
          statusText = 'CONFIRMED ✓';
          statusClass = 'text-green-500';
      } else if (isActive) {
          borderClass = 'border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.15)]';
          bgClass = 'bg-[#1a263d]';
          icon = <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse block"></span>;
          statusText = 'ACTIVE';
          statusClass = 'text-blue-400';
      } else if (isFailed) {
          borderClass = 'border-red-500/50';
          bgClass = 'bg-red-950/20';
          icon = <span className="text-red-500 font-bold">✕</span>;
          statusText = 'CANCELLED';
          statusClass = 'text-red-500';
      }

      return (
          <div className={\`p-4 rounded-xl border \${borderClass} \${bgClass} transition-all duration-300 flex flex-col h-full\`}>
              <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[10px]">0{num}</span>
                      <h4 className="text-slate-300 font-bold text-xs tracking-widest uppercase">{title}</h4>
                  </div>
                  <div className="flex items-center justify-center w-5 h-5">
                      {icon}
                  </div>
              </div>
              <div className={\`text-[10px] \${statusClass} font-bold tracking-widest mb-3 uppercase\`}>
                  {statusText}
              </div>
              <div className={\`text-xs \${isWaiting ? 'text-slate-600' : 'text-slate-300'} flex-1 flex flex-col justify-center\`}>
                  {children}
              </div>
          </div>
      );
  };

  const getDuration = () => {
    if (!state.startConfirmedTime) return '---';
    const diff = Math.floor((Date.now() - new Date(state.startConfirmedTime).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return \`\${m}m \${s}s\`;
  };

  return (
    <div className="mt-8 space-y-6 max-w-7xl mx-auto">
      
      {/* 1. EA MONITOR HEADER */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {state.status === 'running' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                <span className={\`relative inline-flex rounded-full h-3 w-3 \${state.status === 'running' ? 'bg-green-500' : 'bg-slate-600'}\`}></span>
              </span>
              DaRa M1 EA v1.0
            </h2>
            <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-bold">M1 ONLY FAST ENTRY ENGINE</p>
          </div>
          <div className="flex flex-col items-end gap-2.5">
             <div className="flex gap-2">
               <span className={\`px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase \${state.status === 'running' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}\`}>
                 EA STATUS: {state.status === 'running' ? 'RUNNING' : 'STOPPED'}
               </span>
               <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold tracking-widest uppercase">
                 AUTO TRADING
               </span>
             </div>
             <div className="flex gap-4 text-xs font-mono text-slate-400 bg-slate-900/60 px-4 py-1.5 rounded-lg border border-slate-800/80">
               <span className="text-yellow-500 font-bold">XAUUSDc</span>
               <span>Bid: <span className="text-white">{state.livePrice?.bidPrice?.toFixed(3) || '---'}</span></span>
               <span>Ask: <span className="text-white">{state.livePrice?.askPrice?.toFixed(3) || '---'}</span></span>
               <span className="text-blue-400">Spread: {state.livePrice?.spread || '---'}</span>
             </div>
          </div>
        </div>
      </div>

      {/* 2. EA ACTIVITY / HEARTBEAT */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800/30 px-5 py-3 border-b border-slate-800/80">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">EA ACTIVITY / EA HEARTBEAT STATE</h3>
        </div>
        <div className="p-8 flex items-center justify-center bg-gradient-to-b from-[#131b2c]/80 to-[#0b101e]">
           <div className="text-center">
              <h2 className={\`text-2xl md:text-3xl font-bold tracking-widest uppercase \${activityColor}\`}>{activityTitle}</h2>
              <p className="text-slate-400 mt-2 tracking-wide text-sm">{activitySub}</p>
           </div>
        </div>
      </div>

      {/* 3. SETUP FLOW */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800/30 px-5 py-3 border-b border-slate-800/80 flex justify-between items-center">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">DaRa SETUP FLOW</h3>
          {setup && (
            <span className={\`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded \${isBuy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}\`}>
              {setup.direction} SETUP ACTIVE
            </span>
          )}
        </div>
        <div className="p-6 md:p-8">
          
          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <FlowCard num={1} title="LIQUIDITY SWEEP" props={getCardProps(1)}>
                {currentStep >= 1 && setup ? (
                   <div className="space-y-1 text-slate-300">
                     <div className={\`font-bold \${dirColor}\`}>{setup.direction}</div>
                     <div>Sweep Price: <span className="font-mono text-white">{setup.sweepLevel.toFixed(3)}</span></div>
                   </div>
                ) : 'Waiting for Liquidity Sweep...'}
             </FlowCard>
             <FlowCard num={2} title="DISPLACEMENT" props={getCardProps(2)}>
                {currentStep >= 2 && setup ? (
                   <div className="text-slate-300">Displacement: <span className="text-green-400 font-bold">YES</span></div>
                ) : 'Waiting for Displacement...'}
             </FlowCard>
             <FlowCard num={3} title="MSS" props={getCardProps(3)}>
                {currentStep >= 3 && setup ? (
                   <div className="text-slate-300">MSS Level: <span className="font-mono text-white">{setup.mssLevel.toFixed(3)}</span></div>
                ) : 'Waiting for MSS...'}
             </FlowCard>
          </div>

          <div className="flex justify-center my-3 text-slate-700/50">↓</div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <FlowCard num={4} title="ENTRY LOCKED 🔒" props={getCardProps(4)} defaultStatus="WAITING">
                {currentStep >= 4 && setup ? (
                   <div className="space-y-1">
                     <div className="text-yellow-500 font-bold text-lg font-mono">{setup.lockedEntryPrice.toFixed(3)}</div>
                     <div className="text-[10px] text-yellow-500/70 tracking-widest">IMMUTABLE ENTRY</div>
                   </div>
                ) : 'Waiting for Lock...'}
             </FlowCard>
             <FlowCard num={5} title="WAITING FOR ENTRY" props={getCardProps(5)}>
                {currentStep >= 4 && setup ? (
                   <div className="space-y-1">
                     <div>Current: <span className="font-mono text-white">{state.livePrice?.goldPrice?.toFixed(3) || '...'}</span></div>
                     <div>Distance: <span className="font-mono text-blue-400">{state.livePrice?.goldPrice ? Math.abs(setup.lockedEntryPrice - state.livePrice.goldPrice).toFixed(3) : '...'}</span></div>
                   </div>
                ) : 'Waiting...'}
             </FlowCard>
             <FlowCard num={6} title="ENTRY REACHED" props={getCardProps(6)}>
                {currentStep === 6 ? (
                   <div className="text-blue-400 font-bold animate-pulse">EXECUTING...</div>
                ) : currentStep > 6 ? (
                   <div className="text-green-400 font-bold">EXECUTED ✓</div>
                ) : 'Waiting for Price...'}
             </FlowCard>
          </div>

          <div className="flex justify-center my-3 text-slate-700/50">↓</div>

          {/* ROW 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <FlowCard num={7} title="TRADE ACTIVE" props={getCardProps(7)}>
                {currentStep >= 7 && activeTrade ? (
                   <div className="grid grid-cols-2 gap-2 text-[10px]">
                     <div>Entry: <span className="font-mono text-white">{activeTrade.entryPrice?.toFixed(3)}</span></div>
                     <div>Lot: <span className="font-mono text-white">{activeTrade.lot}</span></div>
                     <div>SL: <span className="font-mono text-red-400">{activeTrade.sl?.toFixed(3)}</span></div>
                     <div>TP: <span className="font-mono text-green-400">{activeTrade.tp?.toFixed(3)}</span></div>
                   </div>
                ) : 'Waiting for Trade...'}
             </FlowCard>
             <FlowCard num={8} title="TRAILING" props={getCardProps(8)}>
                {currentStep >= 8 && activeTrade ? (
                   <div className="space-y-1">
                     <div>Current SL: <span className="font-mono text-yellow-400">{activeTrade.sl?.toFixed(3)}</span></div>
                     <div>Profit: <span className={\`font-mono \${activeTrade.profit && activeTrade.profit >= 0 ? 'text-green-400' : 'text-red-400'}\`}>\${activeTrade.profit?.toFixed(2) || '0.00'}</span></div>
                   </div>
                ) : 'Waiting for Trailing...'}
             </FlowCard>
             <FlowCard num={9} title="TRADE CLOSED" props={getCardProps(9)}>
                {currentStep === 9 ? (
                   <div className="space-y-1 text-slate-400">
                     <div>Trade Finished.</div>
                     <div className="text-green-500 font-bold text-[10px] tracking-widest mt-1">RESETTING TO SCAN...</div>
                   </div>
                ) : 'Waiting for Close...'}
             </FlowCard>
          </div>

        </div>
      </div>

      {/* 4. SYSTEM HEALTH MATRIX */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800/30 px-5 py-3 border-b border-slate-800/80">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">SYSTEM HEALTH MATRIX</h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-6 gap-4">
           <div className="bg-[#131b2c] p-3 rounded-lg border border-slate-800/50">
             <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">MT5 Connection</div>
             <div className="text-green-400 text-xs font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> CONNECTED</div>
           </div>
           <div className="bg-[#131b2c] p-3 rounded-lg border border-slate-800/50">
             <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">EA Bridge</div>
             <div className="text-green-400 text-xs font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> ACTIVE</div>
           </div>
           <div className="bg-[#131b2c] p-3 rounded-lg border border-slate-800/50">
             <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Data Latency</div>
             <div className="text-blue-400 text-xs font-bold font-mono">15 ms</div>
           </div>
           <div className="bg-[#131b2c] p-3 rounded-lg border border-slate-800/50">
             <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">News Guard</div>
             <div className="text-green-400 text-xs font-bold">SAFE</div>
           </div>
           <div className="bg-[#131b2c] p-3 rounded-lg border border-slate-800/50">
             <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Risk Guard</div>
             <div className="text-green-400 text-xs font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> ACTIVE</div>
           </div>
           <div className="bg-[#131b2c] p-3 rounded-lg border border-slate-800/50">
             <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Duration</div>
             <div className="text-slate-300 text-xs font-bold font-mono">{getDuration()}</div>
           </div>
        </div>
      </div>

      {/* 5. AUDIT TRAIL */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800/30 px-5 py-3 border-b border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">DaRa Activity / Audit Trail</h3>
          <div className="flex gap-2 text-[10px] font-bold tracking-widest uppercase">
             {['ALL', 'SETUP', 'TRADE', 'SYSTEM'].map(f => (
               <button 
                 key={f} 
                 onClick={() => setFilter(f as any)}
                 className={\`px-3 py-1 rounded transition-colors \${filter === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'}\`}
               >
                 {f}
               </button>
             ))}
          </div>
        </div>
        <div className="p-4 bg-[#070b14] h-64 overflow-y-auto font-mono text-[11px] space-y-2">
           {logs.filter(l => filter === 'ALL' || l.type === filter).map((log, i) => (
             <div key={i} className="flex gap-4 text-slate-400 hover:bg-slate-800/30 p-1.5 rounded">
                <span className="text-slate-600 shrink-0">[{log.time}]</span>
                <span className={\`\${log.msg.includes('Error') || log.msg.includes('Cancel') ? 'text-red-400' : log.msg.includes('Executed') || log.msg.includes('Closed') ? 'text-green-400' : log.msg.includes('Locked') ? 'text-yellow-400' : 'text-slate-300'}\`}>
                  {log.msg}
                </span>
             </div>
           ))}
           {logs.length === 0 && (
             <div className="text-slate-600 text-center mt-10">No activity recorded yet...</div>
           )}
        </div>
      </div>

    </div>
  );
};
`

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log('Done writing PRO layout');
