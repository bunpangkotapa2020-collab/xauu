const fs = require('fs');

const code = `import React from 'react';
import { BotState } from '../types';

interface DaRaSetupViewProps {
  state: BotState;
}

export const DaRaSetupView: React.FC<DaRaSetupViewProps> = ({ state }) => {
  const signalDetails = state.signalDetails;
  const setup = signalDetails?.daraSetup;
  const daraState = signalDetails?.daraState || 'IDLE';

  // State calculations
  let activeStep = 1;
  const activeTrade = state.openTrades?.find(t => t.isBotTrade || t.magicNumber === 778899);

  if (daraState === 'IDLE') {
    activeStep = 0;
  } else if (!setup) {
    activeStep = 1;
  } else if (setup.status === 'CANCELED') {
    if (daraState === 'WAIT_FOR_LOCKED_ENTRY' || setup.lockedEntryPrice > 0) activeStep = 6;
    else if (setup.mssLevel > 0) activeStep = 4;
    else if (setup.displacementConfirmed) activeStep = 3;
    else activeStep = 2;
  } else if (setup.status === 'EXECUTED' || daraState === 'TRADE_ACTIVE' || daraState === 'TRAILING') {
    if (!activeTrade) {
       activeStep = 9;
    } else {
       const isBuy = setup.direction === 'BUY';
       const slMoved = isBuy ? activeTrade.sl > setup.virtualSLPrice : activeTrade.sl < setup.virtualSLPrice;
       if (slMoved || daraState === 'TRAILING') {
         activeStep = 8;
       } else {
         activeStep = 7;
       }
    }
  } else {
    // PENDING_ENTRY
    if (daraState === 'WAIT_FOR_LOCKED_ENTRY') activeStep = 6;
    else if (setup.lockedEntryPrice > 0) activeStep = 5;
    else if (setup.mssLevel > 0) activeStep = 4;
    else if (setup.displacementConfirmed) activeStep = 3;
    else activeStep = 2;
  }

  const getStepProps = (stepIndex: number) => {
    const isCancelled = setup?.status === 'CANCELED';
    const isCompleted = activeStep > stepIndex || (isCancelled && activeStep > stepIndex);
    const isActive = activeStep === stepIndex && !isCancelled;
    const isFailed = activeStep === stepIndex && isCancelled;
    return { isCompleted, isActive, isFailed };
  };

  const StepRow = ({ stepNum, title, status, isCompleted, isActive, isFailed, isLast = false, children }: any) => {
    let icon = <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />;
    let borderClass = "border-gray-800/50";
    let bgClass = "bg-transparent";
    let textClass = "text-gray-600";
    let lineClass = "bg-gray-800";
    
    if (isCompleted) {
      icon = <span className="text-green-500 font-bold text-sm">✓</span>;
      borderClass = "border-green-500/30";
      bgClass = "bg-green-500/5";
      textClass = "text-gray-300";
      lineClass = "bg-green-500/40";
    } else if (isFailed) {
      icon = <span className="text-red-500 font-bold text-sm">✕</span>;
      borderClass = "border-red-500/40";
      bgClass = "bg-red-500/5";
      textClass = "text-gray-300";
    } else if (isActive) {
      icon = <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />;
      borderClass = "border-blue-500/50";
      bgClass = "bg-blue-500/5";
      textClass = "text-white";
    }

    return (
      <div className="relative pl-10 pb-6 last:pb-0">
        {/* Vertical line connecting steps */}
        {!isLast && (
          <div className={\`absolute left-[15px] top-8 bottom-[-8px] w-[2px] \${lineClass}\`} />
        )}
        
        {/* Step Icon */}
        <div className={\`absolute left-0 top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#0B0F19] z-10 transition-colors duration-300 \${isCompleted ? 'border-green-500/50' : isFailed ? 'border-red-500/50' : isActive ? 'border-blue-500' : 'border-gray-700'}\`}>
          {icon}
        </div>

        {/* Content Box */}
        <div className={\`rounded-xl border \${borderClass} \${bgClass} p-4 transition-all duration-300\`}>
           <div className="flex justify-between items-center">
              <h3 className={\`text-sm font-bold tracking-widest uppercase \${textClass}\`}>
                STEP {stepNum} <span className="text-gray-600 mx-2">—</span> {title}
              </h3>
              {status && (
                <span className={\`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded \${isCompleted ? 'bg-green-500/10 text-green-400' : isFailed ? 'bg-red-500/10 text-red-400' : isActive ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500'}\`}>
                  {status}
                </span>
              )}
           </div>
           {children && (
              <div className={\`mt-4 \${isActive || isCompleted || isFailed ? 'opacity-100' : 'opacity-30'}\`}>
                {children}
              </div>
           )}
        </div>
      </div>
    );
  };

  const isBuy = setup?.direction === 'BUY';
  const dirColor = isBuy ? 'text-green-400' : 'text-red-400';

  if (daraState === 'IDLE') {
    return (
      <div className="bg-[#0B0F19] border border-gray-800/80 rounded-2xl p-8 mt-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
          <span className="text-blue-500">🔥 DaRa M1 EA</span>
          <span className="text-gray-600 font-medium tracking-widest text-xs uppercase">| TRADING TERMINAL</span>
        </h2>
        <div className="bg-gray-900/50 rounded-xl p-12 text-center border border-gray-800/50">
           <div className="w-16 h-16 rounded-full bg-gray-800/80 mx-auto mb-5 flex items-center justify-center border border-gray-700/50">
             <span className="text-gray-500 text-2xl">⏸️</span>
           </div>
           <p className="text-gray-300 font-bold text-lg tracking-widest uppercase">ENGINE IS IDLE</p>
           <p className="text-gray-500 text-sm mt-3">Press START to initiate M1 Market Scanning</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F19] border border-gray-800/80 rounded-2xl p-6 lg:p-8 mt-6 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-gray-800/50 pb-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-3">
          <span className="text-blue-500">🔥 DaRa M1 EA</span>
          <span className="text-gray-600 font-medium tracking-widest text-xs uppercase">| TRADING TERMINAL</span>
        </h2>
        {setup && (
          <div className={\`px-4 py-1.5 rounded-md border font-bold tracking-widest text-xs uppercase \${isBuy ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}\`}>
            {setup.direction} SETUP ACTIVE
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto space-y-0 relative">
        
        {/* STEP 1: SCANNING */}
        <StepRow stepNum={1} title="MARKET SCANNING" 
          status={getStepProps(1).isActive ? 'SCANNING' : getStepProps(1).isCompleted ? 'DONE' : 'WAITING'}
          {...getStepProps(1)}>
          <div className="flex items-center gap-4">
            {getStepProps(1).isActive && (
               <div className="w-5 h-5 border-[3px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            )}
            <span className={getStepProps(1).isActive ? "text-blue-200 text-sm" : "text-gray-500 text-sm"}>
              Searching for Liquidity Sweep on M1 Market...
            </span>
          </div>
        </StepRow>

        {/* STEP 2: LIQUIDITY SWEEP */}
        <StepRow stepNum={2} title="LIQUIDITY SWEEP" 
          status={getStepProps(2).isCompleted || getStepProps(2).isActive ? 'DETECTED' : getStepProps(2).isFailed ? 'CANCELLED' : 'WAITING'}
          {...getStepProps(2)}>
          {setup && (
             <div className="flex items-center gap-10">
               <div>
                 <span className="text-gray-500 text-[10px] block mb-1 uppercase tracking-widest font-bold">Sweep Price</span>
                 <span className="font-mono text-white text-lg">{setup.sweepLevel.toFixed(3)}</span>
               </div>
               <div>
                 <span className="text-gray-500 text-[10px] block mb-1 uppercase tracking-widest font-bold">Direction</span>
                 <span className={\`font-bold tracking-widest uppercase \${dirColor}\`}>{setup.direction}</span>
               </div>
             </div>
          )}
        </StepRow>

        {/* STEP 3: DISPLACEMENT */}
        <StepRow stepNum={3} title="DISPLACEMENT" 
          status={getStepProps(3).isCompleted ? 'CONFIRMED' : getStepProps(3).isActive ? 'WAITING' : getStepProps(3).isFailed ? 'CANCELLED' : 'WAITING'}
          {...getStepProps(3)}>
          {setup && activeStep >= 3 && (
             <div className="flex items-center gap-4">
               <span className="text-gray-400 text-sm">Displacement Confirmed:</span>
               <span className={\`font-bold \${setup.displacementConfirmed ? 'text-green-400' : 'text-orange-400'}\`}>
                 {setup.displacementConfirmed ? 'YES' : 'WAITING'}
               </span>
             </div>
          )}
        </StepRow>

        {/* STEP 4: MSS */}
        <StepRow stepNum={4} title="MARKET STRUCTURE SHIFT" 
          status={getStepProps(4).isCompleted ? 'CONFIRMED' : getStepProps(4).isActive ? 'WAITING' : getStepProps(4).isFailed ? 'CANCELLED' : 'WAITING'}
          {...getStepProps(4)}>
          {setup && setup.mssLevel > 0 && activeStep >= 4 && (
             <div className="flex items-center gap-4">
               <span className="text-gray-400 text-sm">MSS Level:</span>
               <span className="font-mono text-white bg-gray-900 px-3 py-1 rounded border border-gray-700">{setup.mssLevel.toFixed(3)}</span>
             </div>
          )}
        </StepRow>

        {/* STEP 5: ENTRY LOCKED */}
        <StepRow stepNum={5} title="ENTRY LOCKED" 
          status={getStepProps(5).isCompleted ? 'LOCKED' : getStepProps(5).isActive ? 'LOCKING' : getStepProps(5).isFailed ? 'CANCELLED' : 'WAITING'}
          {...getStepProps(5)}>
          {setup && setup.lockedEntryPrice > 0 && activeStep >= 5 && (
             <div className="flex flex-col gap-3">
               <div className="flex items-center gap-5">
                  <span className={\`text-3xl font-bold \${dirColor}\`}>
                    {setup.lockedEntryPrice.toFixed(3)}
                  </span>
                  <span className="px-3 py-1 text-[10px] font-bold tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded uppercase flex items-center gap-2">
                    <span>🔒</span> IMMUTABLE ENTRY
                  </span>
               </div>
             </div>
          )}
        </StepRow>

        {/* STEP 6: WAITING FOR ENTRY */}
        <StepRow stepNum={6} title="WAITING FOR ENTRY" 
          status={getStepProps(6).isCompleted ? 'REACHED' : getStepProps(6).isActive ? 'WAITING' : getStepProps(6).isFailed ? 'CANCELLED' : 'WAITING'}
          {...getStepProps(6)}>
          {setup && setup.lockedEntryPrice > 0 && activeStep >= 6 && (
             <div className="space-y-4">
               {getStepProps(6).isFailed && (
                 <div className="text-red-400 text-sm bg-red-500/5 px-4 py-3 rounded-lg border border-red-500/20 flex items-center gap-3">
                   <span className="text-lg">✕</span>
                   <div>
                     <strong className="block mb-0.5">Setup Cancelled</strong>
                     <span className="opacity-80">{setup.cancellationReason || 'Virtual Limit hit before entry.'}</span>
                   </div>
                 </div>
               )}
               <div className="grid grid-cols-3 gap-6 bg-gray-900/40 p-5 rounded-xl border border-gray-800/50">
                 <div>
                   <span className="text-gray-500 text-[10px] block mb-1.5 uppercase tracking-widest font-bold">Locked Entry</span>
                   <span className="font-mono text-gray-300 text-xl">{setup.lockedEntryPrice.toFixed(3)}</span>
                 </div>
                 <div>
                   <span className="text-gray-500 text-[10px] block mb-1.5 uppercase tracking-widest font-bold">Current Price</span>
                   <span className="font-mono text-white text-xl">{state.livePrice?.goldPrice?.toFixed(3) || '...'}</span>
                 </div>
                 <div>
                   <span className="text-gray-500 text-[10px] block mb-1.5 uppercase tracking-widest font-bold">Distance</span>
                   <span className="font-mono text-blue-400 text-xl">
                     {state.livePrice?.goldPrice ? Math.abs(setup.lockedEntryPrice - state.livePrice.goldPrice).toFixed(3) : '...'}
                   </span>
                 </div>
               </div>
             </div>
          )}
        </StepRow>

        {/* STEP 7: TRADE EXECUTED */}
        <StepRow stepNum={7} title="TRADE EXECUTED" 
          status={getStepProps(7).isCompleted ? 'EXECUTED' : getStepProps(7).isActive ? 'ACTIVE' : 'WAITING'}
          {...getStepProps(7)}>
          {setup && activeStep >= 7 && (
             <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-700/50">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-5">
                 <div>
                   <span className="text-gray-500 text-[10px] block mb-1.5 uppercase tracking-widest font-bold">Entry</span>
                   <span className="font-mono text-white text-lg">{activeTrade?.entryPrice?.toFixed(3) || setup.lockedEntryPrice.toFixed(3)}</span>
                 </div>
                 <div>
                   <span className="text-gray-500 text-[10px] block mb-1.5 uppercase tracking-widest font-bold">Hard SL</span>
                   <span className="font-mono text-red-400 text-lg">{activeTrade?.sl?.toFixed(3) || setup.virtualSLPrice.toFixed(3)}</span>
                 </div>
                 <div>
                   <span className="text-gray-500 text-[10px] block mb-1.5 uppercase tracking-widest font-bold">Hard TP</span>
                   <span className="font-mono text-green-400 text-lg">{activeTrade?.tp?.toFixed(3) || setup.virtualTPPrice.toFixed(3)}</span>
                 </div>
                 <div>
                   <span className="text-gray-500 text-[10px] block mb-1.5 uppercase tracking-widest font-bold">Lot Size</span>
                   <span className="font-mono text-white text-lg">{activeTrade?.lot || '...'}</span>
                 </div>
               </div>
               {(activeTrade?.id || activeTrade?.ticket) && (
                 <div className="text-sm text-gray-500 flex justify-between items-center border-t border-gray-800/80 pt-4 mt-2">
                   <span className="font-mono">Ticket: #{activeTrade.id || activeTrade.ticket}</span>
                   <span className="text-green-500 font-bold text-[10px] tracking-widest bg-green-500/10 px-3 py-1 rounded uppercase">🟢 ACTIVE TRADE</span>
                 </div>
               )}
             </div>
          )}
        </StepRow>

        {/* STEP 8: TRAILING */}
        <StepRow stepNum={8} title="PROFIT TRAILING" 
          status={getStepProps(8).isCompleted ? 'DONE' : getStepProps(8).isActive ? 'TRAILING' : 'WAITING'}
          {...getStepProps(8)}>
          {activeStep >= 8 && activeTrade && (
             <div className="flex items-center gap-12 bg-gray-900/40 p-5 rounded-xl border border-gray-800/50">
               <div>
                 <span className="text-gray-500 text-[10px] block mb-1.5 uppercase tracking-widest font-bold">Current SL</span>
                 <span className="font-mono text-yellow-400 text-xl">{activeTrade.sl.toFixed(3)}</span>
               </div>
               <div>
                 <span className="text-gray-500 text-[10px] block mb-1.5 uppercase tracking-widest font-bold">Floating PnL</span>
                 <span className={\`font-mono text-xl \${activeTrade.profit && activeTrade.profit >= 0 ? 'text-green-400' : 'text-red-400'}\`}>
                   \${activeTrade.profit?.toFixed(2) || '0.00'}
                 </span>
               </div>
             </div>
          )}
        </StepRow>

        {/* STEP 9: TRADE CLOSED */}
        <StepRow stepNum={9} title="TRADE CLOSED" 
          status={getStepProps(9).isActive ? 'CLOSED' : 'WAITING'}
          isLast
          {...getStepProps(9)}>
          {activeStep === 9 && (
             <div className="text-gray-400 text-sm flex items-center gap-3 bg-gray-900/30 p-4 rounded-lg border border-gray-800/50">
               <div className="w-4 h-4 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin"></div>
               <span>Trade completed. DaRa M1 EA is resetting to Market Scanning...</span>
             </div>
          )}
        </StepRow>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log('Done writing updated view.');
