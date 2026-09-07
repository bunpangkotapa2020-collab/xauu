const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

const replacement = `                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {[
                      { amt: '50' },
                      { amt: '100' },
                      { amt: '500' },
                      { amt: '1000' },
                      { amt: '5000' },
                      { amt: '10000' },
                    ].map((dl) => {
                      const curr = botState?.account?.currency || 'USC';
                      let label = \`\${dl.amt} \${curr}\`;
                      if (curr === 'USC') {
                        label += \` ($\${(parseFloat(dl.amt)/100).toFixed(0)})\`;
                      }
                      return (
                      <button
                        key={dl.amt}
                        type="button"
                        onClick={() => setMaxDailyLossAmount(dl.amt)}
                        className={\`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer \${
                          maxDailyLossAmount === dl.amt
                            ? 'bg-rose-500 text-white font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }\`}
                      >
                        {label}
                      </button>
                    )})}`;

const target = `                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {[
                      { usc: '100', label: '100 USC ($1)' },
                      { usc: '500', label: '500 USC ($5)' },
                      { usc: '1000', label: '1,000 USC ($10)' },
                      { usc: '2000', label: '2,000 USC ($20)' },
                      { usc: '5000', label: '5,000 USC ($50)' },
                      { usc: '10000', label: '10,000 USC ($100)' },
                    ].map((dl) => (
                      <button
                        key={dl.usc}
                        type="button"
                        onClick={() => setMaxDailyLossAmount(dl.usc)}
                        className={\`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer \${
                          maxDailyLossAmount === dl.usc
                            ? 'bg-rose-500 text-white font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }\`}
                      >
                        {dl.label}
                      </button>
                    ))}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
