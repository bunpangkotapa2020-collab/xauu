const fs = require('fs');

let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

const oldBox = `            {fullSetupConfirmed ? (
              <div className="space-y-1 mt-1">
                <div className={\`font-black \${setup?.direction === 'BUY' ? 'text-blue-400' : 'text-rose-400'}\`}>
                  ទិសដៅ: {setup?.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entry:</span>
                  <strong className="text-white">{entryTriggerPrice?.toFixed(3) || '—'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Live Price:</span>
                  <strong className="text-amber-400">{currentPrice.toFixed(3)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SL:</span>
                  <strong className="text-rose-400">{setup?.sl?.toFixed(3) || '—'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TP:</span>
                  <strong className="text-emerald-400">{setup?.tp?.toFixed(3) || '—'}</strong>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700/50 text-[10px] break-words">
                  <span className="text-slate-500 block mb-0.5">ស្ថានភាព:</span>
                  <strong className={isExecutionBlocked ? 'text-rose-400' : isTriggered ? 'text-emerald-400' : 'text-amber-400'}>
                    {entryStatusStr}
                  </strong>
                </div>
              </div>
            ) : (
              <div>—</div>
            )}`;

const newBox = `            {fullSetupConfirmed ? (
              <div className="space-y-1 mt-1">
                <div className={\`font-black \${setup?.direction === 'BUY' ? 'text-blue-400' : 'text-rose-400'}\`}>
                  ទិសដៅ៖ {setup?.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">តម្លៃចូល៖</span>
                  <strong className="text-white">{entryTriggerPrice?.toFixed(3) || '—'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SL៖</span>
                  <strong className="text-rose-400">{setup?.sl?.toFixed(3) || '—'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TP៖</span>
                  <strong className="text-emerald-400">{setup?.tp?.toFixed(3) || '—'}</strong>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700/50 text-[10px] break-words">
                  {isExecutionBlocked ? (
                    <strong className="text-rose-400 block">🔴 BLOCKED: {setup?.executionState}</strong>
                  ) : isTriggered ? (
                    <>
                      <strong className="text-emerald-400 block">🟢 បានដល់ចំណុចចូល</strong>
                      <span className="text-emerald-400/80 block mt-0.5">តម្លៃចូល៖ {entryTriggerPrice?.toFixed(3)}</span>
                    </>
                  ) : (
                    <>
                      <strong className="text-amber-400 block">⏳ កំពុងរង់ចាំតម្លៃចូល</strong>
                      <span className="text-slate-400 block mt-0.5">តម្លៃ Trigger៖ {entryTriggerPrice?.toFixed(3)}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>—</div>
            )}`;

content = content.replace(oldBox, newBox);
fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
