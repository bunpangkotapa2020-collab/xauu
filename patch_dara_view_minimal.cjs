const fs = require('fs');

const code = `import React from 'react';
import { BotState, TradeOrder } from '../types';

interface DaRaSetupViewProps {
  state: BotState;
}

export const DaRaSetupView: React.FC<DaRaSetupViewProps> = ({ state }) => {
  const signalDetails = state.signalDetails;
  const setup = signalDetails?.daraSetup;
  const daraState = signalDetails?.daraState || 'IDLE';

  // Find active DaRa trade
  const activeTrade = state.openTrades?.find((t: TradeOrder) => t.isBotTrade || t.magicNumber === 778899);

  let activeStep = 1;
  const isCanceled = setup?.status === 'CANCELED';

  if (daraState === 'IDLE') {
    activeStep = 0;
  } else if (!setup || daraState === 'SCANNING') {
    activeStep = 1;
  } else if (isCanceled) {
    if (daraState === 'WAIT_FOR_LOCKED_ENTRY') activeStep = 6;
    else if (setup.lockedEntryPrice > 0) activeStep = 5;
    else if (setup.mssLevel > 0) activeStep = 4;
    else if (setup.displacementConfirmed) activeStep = 3;
    else activeStep = 2;
  } else if (setup.status === 'EXECUTED' || ['TRADE_ACTIVE', 'TRAILING', 'TRADE_CLOSED'].includes(daraState)) {
    if (!activeTrade) {
      activeStep = 10;
    } else {
      const isBuy = setup.direction === 'BUY';
      // If trailing state is active or SL moved beyond initial virtual SL
      const slMoved = isBuy ? activeTrade.sl > setup.virtualSLPrice : activeTrade.sl < setup.virtualSLPrice;
      if (daraState === 'TRAILING' || slMoved) {
        activeStep = 9;
      } else {
        activeStep = 8;
      }
    }
  } else if (daraState === 'EXECUTING') {
    activeStep = 7;
  } else if (daraState === 'WAIT_FOR_LOCKED_ENTRY') {
    activeStep = 6;
  } else if (setup.lockedEntryPrice > 0) {
    activeStep = 5;
  } else if (setup.mssLevel > 0) {
    activeStep = 4;
  } else if (setup.displacementConfirmed) {
    activeStep = 3;
  } else if (setup.sweepLevel > 0) {
    activeStep = 2;
  }

  const isBuy = setup?.direction === 'BUY';
  const dirColor = isBuy ? 'text-green-400' : 'text-red-400';

  const Step = ({ stepNum, title, isCompleted, isActive, isFailed, cancelReason, children }: any) => {
    let icon = <div className="w-2 h-2 rounded-full bg-gray-600" />;
    let textClass = "text-gray-600";
    let titleClass = "text-gray-500";
    
    if (isCompleted) {
      icon = <span className="text-green-500 font-bold text-xs">✓</span>;
      textClass = "text-gray-300";
      titleClass = "text-gray-400";
    } else if (isFailed) {
      icon = <span className="text-red-500 font-bold text-xs">✕</span>;
      textClass = "text-red-400";
      titleClass = "text-red-400 font-bold";
    } else if (isActive) {
      icon = <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />;
      textClass = "text-white";
      titleClass = "text-blue-400 font-bold";
    }

    return (
      <div className="relative pl-10 pb-6 group">
        {/* Step Icon / Dot */}
        <div className={\`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-[#0B0F19] z-10 transition-all duration-300 \${isCompleted ? 'border-green-500/50' : isFailed ? 'border-red-500/50' : isActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}\`}>
          {icon}
        </div>

        {/* Content */}
        <div className={\`transition-opacity duration-300 \${isActive || isCompleted || isFailed ? 'opacity-100' : 'opacity-40'}\`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={\`text-xs font-bold tracking-widest \${titleClass}\`}>
              {title}
            </span>
          </div>
          
          {children && (
            <div className="mt-1">
              {children}
            </div>
          )}

          {isFailed && cancelReason && (
            <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded inline-block">
              {cancelReason}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getProps = (n: number) => {
    const isCancelled = setup?.status === 'CANCELED';
    return {
      isCompleted: activeStep > n || (isCancelled && activeStep > n),
      isActive: activeStep === n && !isCancelled,
      isFailed: activeStep === n && isCancelled,
      cancelReason: activeStep === n && isCancelled ? setup.cancellationReason : null
    };
  };

  if (daraState === 'IDLE') {
    return (
      <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-6 mt-6">
        <h2 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2 tracking-widest uppercase">
          <span className="text-blue-500">🔥 DaRa M1 EA</span>
          <span>| TRADING TERMINAL</span>
        </h2>
        <div className="flex flex-col items-center justify-center py-10 opacity-60">
           <div className="text-3xl mb-3">⏸️</div>
           <p className="text-gray-300 font-bold tracking-widest">ENGINE IS IDLE</p>
           <p className="text-gray-500 text-xs mt-2">Press START to initiate M1 Market Scanning</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800/50 pb-4">
        <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2 tracking-widest uppercase">
          <span className="text-blue-500">🔥 DaRa M1 EA</span>
          <span>| TRADING TERMINAL</span>
        </h2>
        {setup && !getProps(1).isActive && (
          <div className={\`px-3 py-1 rounded text-xs font-bold tracking-widest uppercase \${isBuy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}\`}>
            {setup.direction} SETUP
          </div>
        )}
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Main Vertical Timeline Line */}
        <div className="absolute left-[11px] top-6 bottom-6 w-[2px] bg-gray-800 rounded-full"></div>

        {/* 1. SCANNING */}
        <Step stepNum={1} title="① SCANNING" {...getProps(1)}>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            {getProps(1).isActive && <span className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>}
            Searching M1 Market for Liquidity Sweep...
          </div>
        </Step>

        {/* 2. LIQUIDITY SWEEP */}
        <Step stepNum={2} title="② LIQUIDITY SWEEP" {...getProps(2)}>
          {setup && activeStep >= 2 && (
            <div className="text-sm text-gray-300 flex items-center gap-4">
              <span className={\`font-bold \${dirColor}\`}>{setup.direction}</span>
              <span className="text-gray-600">|</span>
              <span>Sweep Price: <span className="font-mono text-white">{setup.sweepLevel.toFixed(3)}</span></span>
            </div>
          )}
        </Step>

        {/* 3. DISPLACEMENT */}
        <Step stepNum={3} title="③ DISPLACEMENT" {...getProps(3)}>
          {setup && activeStep >= 3 && !getProps(3).isFailed && (
             <div className="text-sm text-gray-300">
               {setup.displacementConfirmed ? <span className="text-green-400 font-bold">CONFIRMED ✓</span> : <span className="text-gray-500">WAITING</span>}
             </div>
          )}
        </Step>

        {/* 4. MSS */}
        <Step stepNum={4} title="④ MSS (MARKET STRUCTURE SHIFT)" {...getProps(4)}>
          {setup && setup.mssLevel > 0 && activeStep >= 4 && !getProps(4).isFailed && (
            <div className="text-sm text-gray-300 flex items-center gap-4">
               <span className="text-green-400 font-bold">CONFIRMED ✓</span>
               <span className="text-gray-600">|</span>
               <span>MSS Level: <span className="font-mono text-white">{setup.mssLevel.toFixed(3)}</span></span>
            </div>
          )}
        </Step>

        {/* 5. ENTRY LOCKED */}
        <Step stepNum={5} title="⑤ ENTRY LOCKED 🔒" {...getProps(5)}>
          {setup && setup.lockedEntryPrice > 0 && activeStep >= 5 && !getProps(5).isFailed && (
            <div className="text-sm text-gray-300 flex items-center gap-4">
               <span className={\`font-bold \${dirColor}\`}>Direction: {setup.direction}</span>
               <span className="text-gray-600">|</span>
               <span>Locked Entry: <span className={\`font-mono font-bold text-lg \${dirColor}\`}>{setup.lockedEntryPrice.toFixed(3)}</span></span>
            </div>
          )}
        </Step>

        {/* 6. WAITING FOR ENTRY */}
        <Step stepNum={6} title="⑥ WAITING FOR ENTRY" {...getProps(6)}>
          {setup && setup.lockedEntryPrice > 0 && activeStep >= 6 && !getProps(6).isFailed && (
            <div className="text-sm text-gray-300 flex items-center gap-4">
               <span>Current Price: <span className="font-mono text-white">{state.livePrice?.goldPrice?.toFixed(3) || '...'}</span></span>
               <span className="text-gray-600">|</span>
               <span>Distance: <span className="font-mono text-blue-400">{state.livePrice?.goldPrice ? Math.abs(setup.lockedEntryPrice - state.livePrice.goldPrice).toFixed(3) : '...'} pts</span></span>
            </div>
          )}
        </Step>

        {/* 7. ENTRY REACHED */}
        <Step stepNum={7} title="⑦ ENTRY REACHED" {...getProps(7)}>
          {getProps(7).isActive && (
            <div className="text-sm text-blue-400 font-bold animate-pulse">
              EXECUTING...
            </div>
          )}
          {getProps(7).isCompleted && (
            <div className="text-sm text-green-400 font-bold">
              EXECUTED ✓
            </div>
          )}
        </Step>

        {/* 8. TRADE ACTIVE */}
        <Step stepNum={8} title="⑧ TRADE ACTIVE" {...getProps(8)}>
          {activeStep >= 8 && activeTrade && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
               <div>
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-0.5">Entry</span>
                 <span className="font-mono text-white text-sm">{activeTrade.entryPrice?.toFixed(3) || setup?.lockedEntryPrice.toFixed(3)}</span>
               </div>
               <div>
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-0.5">Hard SL</span>
                 <span className="font-mono text-red-400 text-sm">{activeTrade.sl?.toFixed(3) || setup?.virtualSLPrice.toFixed(3)}</span>
               </div>
               <div>
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-0.5">Hard TP</span>
                 <span className="font-mono text-green-400 text-sm">{activeTrade.tp?.toFixed(3) || setup?.virtualTPPrice.toFixed(3)}</span>
               </div>
               <div>
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-0.5">Lot Size</span>
                 <span className="font-mono text-white text-sm">{activeTrade.lot || '...'}</span>
               </div>
            </div>
          )}
        </Step>

        {/* 9. TRAILING */}
        <Step stepNum={9} title="⑨ TRAILING" {...getProps(9)}>
          {activeStep >= 9 && activeTrade && (
            <div className="flex items-center gap-6 mt-1">
               <div>
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-0.5">Current SL</span>
                 <span className="font-mono text-yellow-400 text-sm">{activeTrade.sl?.toFixed(3)}</span>
               </div>
               <div>
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-0.5">Profit</span>
                 <span className={\`font-mono text-sm \${activeTrade.profit && activeTrade.profit >= 0 ? 'text-green-400' : 'text-red-400'}\`}>
                   \${activeTrade.profit?.toFixed(2) || '0.00'}
                 </span>
               </div>
            </div>
          )}
        </Step>

        {/* 10. CLOSED */}
        <Step stepNum={10} title="⑩ CLOSED" {...getProps(10)}>
          {activeStep === 10 && (
            <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
               <span className="text-green-400 font-bold">TRADE CLOSED</span>
               <span className="text-gray-600">|</span>
               <span>Resetting to Scanning...</span>
            </div>
          )}
        </Step>

      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log('Done writing strict vertical timeline minimal view.');
