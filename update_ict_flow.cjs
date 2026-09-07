const fs = require('fs');

const code = `import React from 'react';
import { ICTTelemetry } from '../MASTER_ICT_EA';
import { CheckCircle2, Clock, AlertCircle, Activity, ArrowDown, ArrowRight, ShieldCheck, Target, TrendingUp } from 'lucide-react';

interface Props {
  telemetry: ICTTelemetry | null;
  state: any;
}

export const IctPipelineFlow: React.FC<Props> = ({ telemetry, state }) => {
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
  
  const signal = state?.signalDetails;
  
  // Stages
  const actualExecutionState = signal?.executionState || setup?.executionState || telemetry?.entryStatus;
  
  const isRejectedBeforeTrigger = actualExecutionState === 'REJECTED: PRICE_BROKE_OB' || actualExecutionState === 'REJECTED: SETUP_EXPIRED_TIMEOUT' || actualExecutionState === 'REJECTED: TP_REACHED_BEFORE_ENTRY';
  const isTriggered = setup?.stage === 'TRIGGERED' || (actualExecutionState && !actualExecutionState.includes('WAITING') && !actualExecutionState.includes('SEARCHING') && !actualExecutionState.includes('VALID SETUP') && !isRejectedBeforeTrigger);
  const isExecutionBlocked = actualExecutionState && (actualExecutionState.includes('REJECTED') || actualExecutionState.includes('BLOCKED') || actualExecutionState.includes('ERROR'));
  const isOrderSent = actualExecutionState === 'ORDER_SENT' || actualExecutionState === 'POSITION_OPENED' || actualExecutionState === 'TRADE OPENED';
  const isPositionOpened = actualExecutionState === 'POSITION_OPENED' || actualExecutionState === 'TRADE OPENED' || (state?.openTrades && state.openTrades.length > 0);
  
  const hasRetracement = m1?.retracement === 'FOUND' || isTriggered || isPositionOpened;
  const has305Fvg = hasRetracement; // Backend implicit

  // Single source of truth from locked ICT setup
  const actualEntry = setup?.actualEntry || setup?.entry || signal?.actualEntry || signal?.entry || (setup?.direction === 'BUY' ? setup?.obHigh : setup?.obLow);
  const actualSl = setup?.sl !== undefined && setup?.sl !== null ? setup.sl : signal?.sl;
  const actualTp = setup?.tp !== undefined && setup?.tp !== null ? setup.tp : signal?.tp;
  
  const Box = ({ title, active, error = false, highlight = false, children, compact = false }: any) => {
    let bg = 'bg-slate-900/50 border-slate-800/50 opacity-50';
    let text = 'text-slate-500';
    let titleText = 'text-slate-400';
    
    if (active) {
      bg = highlight ? 'bg-blue-500/10 border-blue-500/30' : 'bg-emerald-950/40 border-emerald-500/30';
      text = highlight ? 'text-blue-300' : 'text-emerald-300';
      titleText = highlight ? 'text-blue-400' : 'text-emerald-400';
    }
    if (error) {
      bg = 'bg-rose-950/40 border-rose-500/30 opacity-100';
      text = 'text-rose-300';
      titleText = 'text-rose-400';
    }

    return (
      <div className={\`flex flex-col p-3 rounded-xl border transition-all \${bg} \${compact ? 'justify-center items-center text-center' : ''}\`}>
        <div className={\`flex items-center gap-2 \${compact ? 'mb-1 justify-center' : 'mb-2'}\`}>
          {active ? (highlight ? <Target size={14} className={titleText} /> : <CheckCircle2 size={14} className={titleText} />) : error ? <AlertCircle size={14} className={titleText} /> : <Clock size={14} className={titleText} />}
          <span className={\`text-xs font-bold uppercase \${titleText}\`}>{title}</span>
        </div>
        <div className={\`text-[11px] font-mono \${text} \${compact ? '' : 'mt-auto'}\`}>{children}</div>
      </div>
    );
  };

  const Arrow = () => (
    <div className="flex justify-center items-center opacity-30">
      <ArrowRight size={14} className="text-slate-400 hidden md:block mx-1" />
      <ArrowDown size={14} className="text-slate-400 md:hidden my-1" />
    </div>
  );

  return (
    <div className="mt-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-blue-400" />
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          លំហូរតាមដាន ICT (ICT SETUP FLOW)
        </h3>
      </div>
      
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        {/* ROW 1: ICT LOGIC (Grid of 4) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Box title="H4 BIAS" active={h4Confirmed}>
            {h4Confirmed ? (
              <span className="text-emerald-400 font-bold">{h4?.bias === 'BEARISH' ? 'BEARISH / ចុះ' : 'BULLISH / ឡើង'}</span>
            ) : 'WAITING'}
          </Box>
          <Box title="M15 CONFIRMATION" active={m15Confirmed}>
            {m15Confirmed ? 'CONFIRMED' : 'WAITING'}
          </Box>
          <Box title="M1 CONFIRMATION" active={m1Confirmed}>
            {m1Confirmed ? 'CONFIRMED' : 'WAITING'}
          </Box>
          <Box title="FULL SETUP" active={fullSetupConfirmed}>
            {fullSetupConfirmed ? <span className="text-emerald-400">READY</span> : 'WAITING'}
          </Box>
        </div>

        {/* Down Arrow separator */}
        <div className="flex justify-center my-1 opacity-30">
          <ArrowDown size={16} className="text-slate-400" />
        </div>

        {/* ROW 2: ENTRY PREP (Grid of 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Box title="ENTRY ZONE" active={fullSetupConfirmed}>
            {fullSetupConfirmed && (setup?.obLow !== undefined || setup?.obHigh !== undefined) ? (
              <span className="text-blue-300 font-bold">
                [{setup?.obLow !== undefined ? setup.obLow.toFixed(3) : '—'} - {setup?.obHigh !== undefined ? setup.obHigh.toFixed(3) : '—'}]
              </span>
            ) : 'WAITING'}
          </Box>
          <Box title="RETRACEMENT" active={hasRetracement || isRejectedBeforeTrigger} error={isRejectedBeforeTrigger}>
            {hasRetracement ? 'CONFIRMED' : isRejectedBeforeTrigger ? 'FAILED / BROKEN' : 'WAITING'}
          </Box>
          <Box title="3-0 + 5-FVG" active={has305Fvg}>
            {has305Fvg ? 'CONFIRMED (BACKEND)' : 'WAITING'}
          </Box>
        </div>

        {/* Down Arrow separator */}
        <div className="flex justify-center my-1 opacity-30">
          <ArrowDown size={16} className="text-slate-400" />
        </div>

        {/* ROW 3: EXECUTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Box title="🎯 ENTRY — ចូលផ្សារ" active={isTriggered} highlight={isTriggered}>
            {isTriggered ? (
              <span className="text-blue-400 font-bold block mt-1">
                PRICE REACHED ENTRY ZONE
                <br/>
                {actualEntry ? \`@ \${actualEntry.toFixed(3)}\` : ''}
              </span>
            ) : 'WAITING FOR PRICE'}
          </Box>
          <Box title="🛡️ SAFETY CHECK" active={isTriggered} error={isExecutionBlocked}>
            {isExecutionBlocked ? (
              <span className="text-rose-400 font-bold">{actualExecutionState || 'BLOCKED BY RISK LIMITS'}</span>
            ) : isTriggered ? (
              <span className="text-emerald-400 font-bold flex items-center justify-center gap-1 mt-1">
                <ShieldCheck size={14} /> ALL CHECKS PASSED
              </span>
            ) : 'WAITING'}
          </Box>
        </div>

        {/* TRADE ACTIVE CARD */}
        {isPositionOpened && state?.openTrades && state.openTrades.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-300"></div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <TrendingUp size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-400 tracking-wide flex items-center gap-2">
                    🟢 TRADE ACTIVE
                  </h3>
                  <p className="text-xs text-emerald-200/60">Position is currently running in MT5</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Direction</div>
                  <div className={\`font-bold \${state.openTrades[0].type === 'BUY' ? 'text-blue-400' : 'text-rose-400'}\`}>
                    {state.openTrades[0].type}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Entry</div>
                  <div className="font-bold text-slate-200">{state.openTrades[0].openPrice.toFixed(3)}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Lot</div>
                  <div className="font-bold text-slate-200">{state.openTrades[0].volume.toFixed(2)}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">SL</div>
                  <div className="font-bold text-slate-200">{state.openTrades[0].sl > 0 ? state.openTrades[0].sl.toFixed(3) : 'NONE'}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">TP</div>
                  <div className="font-bold text-slate-200">{state.openTrades[0].tp > 0 ? state.openTrades[0].tp.toFixed(3) : 'NONE'}</div>
                </div>
              </div>
              
              <div className="mt-3 text-[10px] text-slate-500 flex justify-end">
                Ticket: #{state.openTrades[0].id}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
`

fs.writeFileSync('src/components/IctPipelineFlow.tsx', code);
console.log('IctPipelineFlow updated.');
