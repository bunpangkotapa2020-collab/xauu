const fs = require('fs');
let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

// 1. Update isTriggered logic
content = content.replace(
  "const isTriggered = setup?.stage === 'TRIGGERED' || (actualExecutionState && !actualExecutionState.includes('WAITING'));",
  `const isRejectedBeforeTrigger = actualExecutionState === 'REJECTED: PRICE_BROKE_OB' || actualExecutionState === 'REJECTED: SETUP_EXPIRED_TIMEOUT';
  const isTriggered = setup?.stage === 'TRIGGERED' || (actualExecutionState && !actualExecutionState.includes('WAITING') && !isRejectedBeforeTrigger);`
);

// 2. Update RETRACEMENT box
content = content.replace(
  /<Box\s+title="RETRACEMENT"[\s\S]*?<\/Box>/,
  `<Box 
            title="RETRACEMENT" 
            active={isTriggered || isRejectedBeforeTrigger} 
            error={isRejectedBeforeTrigger}
          >
            <div className="text-[11px] text-slate-400 mb-1">បកត្រឡប់</div>
            {isTriggered ? (
              <>
                <div className="text-emerald-400">ENTERED ZONE</div>
                <div className="text-[11px] text-emerald-400/80">តម្លៃបានចូលតំបន់</div>
              </>
            ) : isRejectedBeforeTrigger ? (
              <>
                <div className="text-rose-400 font-bold">FAILED</div>
                <div className="text-[11px] text-rose-400/80">បរាជ័យ</div>
              </>
            ) : fullSetupConfirmed ? (
              <>
                <div>WAITING</div>
                <div className="text-[11px] text-slate-400">កំពុងរង់ចាំ</div>
              </>
            ) : (
              <>
                <div>WAITING</div>
                <div className="text-[11px] text-slate-400">កំពុងរង់ចាំ</div>
              </>
            )}
          </Box>`
);

// 3. Update ACTUAL ENTRY box (just adding isRejectedBeforeTrigger condition)
content = content.replace(
  /<Box\s+title="🎯 ACTUAL ENTRY"[\s\S]*?highlight=\{fullSetupConfirmed && !isTriggered\}[\s\S]*?error=\{isExecutionBlocked\}\s*>/,
  `<Box 
            title="🎯 ACTUAL ENTRY" 
            active={isTriggered || fullSetupConfirmed} 
            highlight={fullSetupConfirmed && !isTriggered && !isRejectedBeforeTrigger}
            error={isExecutionBlocked && isTriggered}
          >`
);

content = content.replace(
  /\{isTriggered \? \([\s\S]*?\) : fullSetupConfirmed \? \(/,
  `{isTriggered ? (
              <div className="space-y-0.5">
                <strong className="text-emerald-400 block text-xs">🟢 ENTRY TRIGGERED</strong>
                <span className="text-emerald-400/80 block text-[11px] mb-1">បានដល់ចំណុចចូល</span>
                
                <div className={\`font-bold \${setup?.direction === 'BUY' ? 'text-blue-400' : 'text-rose-400'}\`}>
                  {setup?.direction === 'BUY' ? 'BUY / ទិញ' : 'SELL / លក់'}
                </div>
                <div className="flex justify-between gap-1 text-[11px] sm:text-xs">
                  <span className="text-slate-500">Entry:</span>
                  <strong className="text-white">{actualEntry?.toFixed(3)}</strong>
                </div>
                <div className="flex justify-between gap-1 text-[11px] sm:text-xs">
                  <span className="text-slate-500">SL:</span>
                  <strong className="text-rose-400">{actualSl?.toFixed(3)}</strong>
                </div>
                <div className="flex justify-between gap-1 text-[11px] sm:text-xs">
                  <span className="text-slate-500">TP:</span>
                  <strong className="text-emerald-400">{actualTp?.toFixed(3)}</strong>
                </div>
              </div>
            ) : isRejectedBeforeTrigger ? (
              <>
                <div className="text-slate-500 font-bold">CANCELED</div>
                <div className="text-[11px] text-slate-500/80">បោះបង់</div>
              </>
            ) : fullSetupConfirmed ? (`
);

// 4. Update RISK CHECK box
content = content.replace(
  /\{!isTriggered \? \(/,
  `{!isTriggered && !isRejectedBeforeTrigger ? (`
);

fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
