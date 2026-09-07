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

  if (!setup && daraState === 'IDLE') {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6 shadow-2xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-blue-400">🔥 DaRa M1 EA</span>
          <span className="text-gray-500 text-sm font-medium">| LIVE SETUP VIEW</span>
        </h2>
        <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
           <div className="w-12 h-12 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center">
             <span className="text-gray-400 text-2xl">⏸️</span>
           </div>
           <p className="text-gray-400 font-medium">Engine is IDLE</p>
           <p className="text-gray-500 text-sm mt-2">Press START to begin scanning</p>
        </div>
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6 shadow-2xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-blue-400">🔥 DaRa M1 EA</span>
          <span className="text-gray-500 text-sm font-medium">| LIVE SETUP VIEW</span>
        </h2>
        <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
           <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
           <p className="text-blue-400 font-bold tracking-widest uppercase">{daraState}</p>
           <p className="text-gray-400 text-sm mt-2">Scanning M1 Market for Liquidity Sweep...</p>
        </div>
      </div>
    );
  }

  const isBuy = setup.direction === 'BUY';
  const color = isBuy ? 'text-green-400' : 'text-red-400';
  const bgColor = isBuy ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = isBuy ? 'border-green-500/30' : 'border-red-500/30';

  const entryReached = ['EXECUTING', 'TRADE_ACTIVE', 'TRAILING', 'TRADE_CLOSED'].includes(daraState) || setup.status === 'EXECUTED';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">🔥 DaRa M1 EA</span>
          <span className="text-gray-500 text-sm font-medium">| LIVE SETUP VIEW</span>
        </h2>
        <div className={\`px-4 py-1.5 rounded-full border \${borderColor} \${bgColor} font-bold \${color} tracking-wider text-sm\`}>
          {setup.direction} SETUP
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core Logic Pipeline */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">DaRa M1 Fast Entry Pipeline</h3>
          
          <div className="space-y-4">
             <div className="flex justify-between items-center pb-2 border-b border-gray-700/50">
               <span className="text-gray-300">Liquidity Sweep</span>
               <span className="font-mono text-white bg-gray-900 px-2 py-1 rounded border border-gray-700">
                  {setup.sweepLevel > 0 ? setup.sweepLevel.toFixed(3) : 'Pending'}
               </span>
             </div>
             
             <div className="flex justify-between items-center pb-2 border-b border-gray-700/50">
               <span className="text-gray-300">Displacement Confirmed</span>
               <span className={\`font-bold \${setup.displacementConfirmed ? 'text-green-400' : 'text-gray-500'}\`}>
                  {setup.displacementConfirmed ? '✅ YES' : 'WAITING'}
               </span>
             </div>

             <div className="flex justify-between items-center pb-2 border-b border-gray-700/50">
               <span className="text-gray-300">MSS Confirmed</span>
               <span className="font-mono text-white bg-gray-900 px-2 py-1 rounded border border-gray-700">
                  {setup.mssLevel > 0 ? setup.mssLevel.toFixed(3) : 'Pending'}
               </span>
             </div>

             <div className="flex justify-between items-center pb-2 border-b border-gray-700/50">
               <span className="text-gray-300">Locked Entry Price</span>
               <span className="font-mono text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/30">
                  {setup.lockedEntryPrice > 0 ? setup.lockedEntryPrice.toFixed(3) : 'Pending'}
               </span>
             </div>
             
             <div className="flex justify-between items-center">
               <span className="text-gray-300">Entry Reached</span>
               <span className={\`font-bold \${entryReached ? 'text-green-400' : 'text-orange-400'}\`}>
                  {entryReached ? '✅ YES' : 'WAITING'}
               </span>
             </div>
          </div>
        </div>

        {/* Protection & Execution Status */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Hard Targets (Virtual & Real)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-500 text-xs mb-1">Calculated SL</div>
                <div className="text-red-400 font-mono font-bold text-lg">{setup.virtualSLPrice.toFixed(3)}</div>
                <div className="text-gray-600 text-xs mt-1">User SL: {setup.userSlDistance} Points</div>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-500 text-xs mb-1">Calculated TP</div>
                <div className="text-green-400 font-mono font-bold text-lg">{setup.virtualTPPrice.toFixed(3)}</div>
                <div className="text-gray-600 text-xs mt-1">User TP: {setup.userTpDistance} Points</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Execution & State</h3>
            
            {setup.status === 'CANCELED' ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                 <p className="text-red-400 font-bold mb-1">SETUP CANCELLED</p>
                 <p className="text-gray-300 text-sm">Reason: {setup.cancellationReason}</p>
                 <p className="text-gray-500 text-xs mt-2">Clearing setup & scanning new...</p>
              </div>
            ) : (
              <div className="text-center bg-gray-900 border border-gray-700 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1 uppercase">Current DaRa State</p>
                <p className="text-blue-400 font-bold text-lg tracking-wider uppercase mb-1">{daraState}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
                   <span className="text-gray-400 text-xs uppercase">Setup Status</span>
                   <span className={\`text-xs font-bold \${setup.status === 'EXECUTED' ? 'text-green-400' : 'text-yellow-400'}\`}>
                     {setup.status}
                   </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log('DaRaSetupView patched successfully');
