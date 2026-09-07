const fs = require('fs');

const content = `import React from 'react';
import { ICTTelemetry } from '../MASTER_ICT_EA';
import { CheckCircle2, Clock, Crosshair, AlertCircle, ArrowRight, Layers, Zap, Terminal, Activity, ArrowDown } from 'lucide-react';

interface Props {
  telemetry: ICTTelemetry | null;
  state: any;
}

export const IctPipelineFlow: React.FC<Props> = ({ telemetry, state }) => {
  const currentPrice = telemetry?.livePrice?.ask || 0;
  const setup = telemetry?.validSetup;
  const h4 = telemetry?.h4;
  const m15 = telemetry?.m15;
  const m1 = telemetry?.m1;

  // Derive steps
  const h4Confirmed = h4?.structure === 'CONFIRMED';
  
  const m15Sweep = m15?.liquiditySweep === 'FOUND';
  const m15Cisd = m15?.cisd === 'CONFIRMED';
  const m15Confirmed = m15Sweep && m15Cisd;

  const m1Disp = m1?.displacement === 'FOUND';
  const m1Fvg = m1?.fvg === 'FOUND';
  const m1Ob = m1?.orderBlock === 'FOUND';
  const m1Confirmed = m1Disp && m1Fvg && m1Ob;

  const fullSetupConfirmed = !!setup || (h4Confirmed && m15Confirmed && m1Confirmed);

  // Stages
  const isTriggered = setup?.stage === 'TRIGGERED' || (setup?.executionState && setup?.executionState !== 'WAITING');
  const isExecutionBlocked = setup?.executionState && setup.executionState.includes('REJECTED');
  const isOrderSent = setup?.executionState === 'ORDER_SENT' || setup?.executionState === 'POSITION_OPENED';
  const isPositionOpened = setup?.executionState === 'POSITION_OPENED';

  // Entry calculations
  const entryTriggerPrice = setup?.direction === 'BUY' ? setup?.obHigh : setup?.obLow;
  const distPts = entryTriggerPrice ? Math.abs(currentPrice - entryTriggerPrice).toFixed(1) : '—';
  
  const Box = ({ title, active, subtitle, icon: Icon, error = false, highlight = false, value = null }: any) => {
    let bg = 'bg-slate-900/50 border-slate-700/50 opacity-60';
    let text = 'text-slate-400';
    let titleText = 'text-slate-400';
    
    if (active) {
      bg = highlight ? 'bg-amber-500/20 border-amber-500/50' : 'bg-emerald-950/40 border-emerald-500/30';
      text = highlight ? 'text-amber-300' : 'text-emerald-300';
      titleText = highlight ? 'text-amber-400' : 'text-emerald-400';
    }
    if (error) {
      bg = 'bg-rose-950/40 border-rose-500/30';
      text = 'text-rose-300';
      titleText = 'text-rose-400';
    }

    return (
      <div className={\`flex flex-col p-3 rounded-xl border transition-all \${bg}\`}>
        <div className="flex items-center gap-2 mb-2">
          {active ? <CheckCircle2 size={14} className={titleText} /> : error ? <AlertCircle size={14} className={titleText} /> : <Clock size={14} className={titleText} />}
          <span className={\`text-xs font-bold uppercase \${titleText}\`}>{title}</span>
        </div>
        {(subtitle || value) && (
          <div className={\`text-[11px] mt-auto font-mono \${text}\`}>
            {value && <div className="font-black text-xs mb-0.5">{value}</div>}
            {subtitle && <div>{subtitle}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-blue-400" />
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          COMPACT ICT SETUP FLOW
        </h3>
      </div>
      
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
        
        {/* ROW 1: DETECTION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Box 
            title="H4 TREND" 
            active={h4Confirmed} 
            subtitle={h4Confirmed ? \`Bias: \${h4?.bias}\` : 'Waiting'} 
          />
          <Box 
            title="M15 STRUCTURE" 
            active={m15Confirmed} 
            subtitle={m15Confirmed ? 'Sweep & CISD ✓' : 'Waiting'} 
          />
          <Box 
            title="M1 SETUP" 
            active={m1Confirmed} 
            subtitle={m1Confirmed ? 'Disp/FVG/OB ✓' : 'Waiting'} 
          />
          <Box 
            title="FULL SETUP" 
            active={fullSetupConfirmed} 
            subtitle={fullSetupConfirmed ? \`\${setup?.direction || 'VALID'} SETUP\` : 'Waiting'} 
          />
        </div>

        {/* ARROW DOWN */}
        <div className="flex justify-center my-3 opacity-30">
          <ArrowDown size={16} className="text-slate-400" />
        </div>

        {/* ROW 2: ENTRY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Box 
            title="ENTRY ZONE" 
            active={fullSetupConfirmed} 
            value={fullSetupConfirmed ? \`[\${setup?.obLow?.toFixed(3)} - \${setup?.obHigh?.toFixed(3)}]\` : '—'}
            subtitle={fullSetupConfirmed ? \`Dist: \${distPts} pts\` : 'Waiting for setup'} 
          />
          <Box 
            title="RETRACEMENT" 
            active={isTriggered} 
            subtitle={isTriggered ? 'Entered Zone ✓' : fullSetupConfirmed ? 'Waiting for price' : '—'} 
          />
          <Box 
            title="🎯 ACTUAL ENTRY" 
            active={isTriggered || fullSetupConfirmed} 
            highlight={fullSetupConfirmed && !isTriggered}
            value={entryTriggerPrice ? entryTriggerPrice.toFixed(3) : '—'}
            subtitle={isTriggered ? 'TRIGGERED ✓' : fullSetupConfirmed ? 'Pending Trigger' : '—'} 
          />
        </div>

        {/* ARROW DOWN */}
        <div className="flex justify-center my-3 opacity-30">
          <ArrowDown size={16} className="text-slate-400" />
        </div>

        {/* ROW 3: EXECUTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Box 
            title="ORDER SENT" 
            active={isOrderSent}
            error={isExecutionBlocked}
            subtitle={isExecutionBlocked ? setup?.executionState : isOrderSent ? 'Request sent to Broker' : 'Pending'} 
          />
          <Box 
            title="POSITION OPENED" 
            active={isPositionOpened} 
            subtitle={isPositionOpened ? \`Ticket: \${setup?.setupId}\` : 'Pending'} 
          />
        </div>
        
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
