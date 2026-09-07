const fs = require('fs');
let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

// Replace SL / TP pips inputs with Trailing Stop Settings

// First, add the state variables
const stateVars = `
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(botState?.riskConfig?.trailingStopEnabled ?? true);
  const [trailingStopActivationPoints, setTrailingStopActivationPoints] = useState(String(botState?.riskConfig?.trailingStopActivationPoints ?? '20'));
  const [trailingStopDistancePoints, setTrailingStopDistancePoints] = useState(String(botState?.riskConfig?.trailingStopDistancePoints ?? '10'));
  const [trailingStopBreakEven, setTrailingStopBreakEven] = useState(botState?.riskConfig?.trailingStopBreakEven ?? true);
  const [trailingStopBreakEvenOffset, setTrailingStopBreakEvenOffset] = useState(String(botState?.riskConfig?.trailingStopBreakEvenOffset ?? '2'));
`;

code = code.replace(/  const \[slPips, setSlPips\] = useState<string>\(.*\);\n  const \[tpPips, setTpPips\] = useState<string>\(.*\);/g, stateVars);

// Update init effect
const initEffect = `
      if (botState.riskConfig.trailingStopEnabled !== undefined) setTrailingStopEnabled(botState.riskConfig.trailingStopEnabled);
      if (botState.riskConfig.trailingStopActivationPoints !== undefined) setTrailingStopActivationPoints(String(botState.riskConfig.trailingStopActivationPoints));
      if (botState.riskConfig.trailingStopDistancePoints !== undefined) setTrailingStopDistancePoints(String(botState.riskConfig.trailingStopDistancePoints));
      if (botState.riskConfig.trailingStopBreakEven !== undefined) setTrailingStopBreakEven(botState.riskConfig.trailingStopBreakEven);
      if (botState.riskConfig.trailingStopBreakEvenOffset !== undefined) setTrailingStopBreakEvenOffset(String(botState.riskConfig.trailingStopBreakEvenOffset));
`;
code = code.replace(/      if \(botState\.riskConfig\.stopLossPips !== undefined\) setSlPips\(String\(botState\.riskConfig\.stopLossPips\)\);\n      if \(botState\.riskConfig\.takeProfitPips !== undefined\) setTpPips\(String\(botState\.riskConfig\.takeProfitPips\)\);/g, initEffect);

// Update handleSave
const handleSaveBlock = `
      const updatedRiskConfig = {
        ...botState?.riskConfig,
        lotSizeMode,
        lotSize: Number(lotSize),
        riskPercent: Number(riskPercent),
        entriesPerSignal: Number(entriesPerSignal),
        maxOpenTrades: Number(maxOpenTrades),
        trailingStopEnabled,
        trailingStopActivationPoints: Number(trailingStopActivationPoints),
        trailingStopDistancePoints: Number(trailingStopDistancePoints),
        trailingStopBreakEven,
        trailingStopBreakEvenOffset: Number(trailingStopBreakEvenOffset)
      };
`;
code = code.replace(/      const updatedRiskConfig = {\n[\s\S]*?stopLossPips: Number\(slPips\),\n        takeProfitPips: Number\(tpPips\)\n      };/m, handleSaveBlock);

// Replace UI Elements
const uiBlock = `
              {/* Trailing Stop Settings */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-300 font-medium text-emerald-400">Trailing Stop (Profit Protection)</div>
                    <div className="text-[10px] text-slate-500">Automatically trails SL in profit</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={trailingStopEnabled} onChange={(e) => setTrailingStopEnabled(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                
                {trailingStopEnabled && (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="text-[11px] text-slate-400">Activation Distance (Price Units)</div>
                      <input type="number" min="5" max="500" value={trailingStopActivationPoints} onChange={(e) => setTrailingStopActivationPoints(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs w-16 text-right font-mono focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-[11px] text-slate-400">Trailing Distance (Price Units)</div>
                      <input type="number" min="5" max="500" value={trailingStopDistancePoints} onChange={(e) => setTrailingStopDistancePoints(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs w-16 text-right font-mono focus:border-amber-500 focus:outline-none" />
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 border-t border-slate-800/50 pt-2">
                      <div className="text-[11px] text-slate-400">Break-Even Protection</div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={trailingStopBreakEven} onChange={(e) => setTrailingStopBreakEven(e.target.checked)} className="sr-only peer" />
                        <div className="w-7 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                    {trailingStopBreakEven && (
                      <div className="flex justify-between items-center">
                        <div className="text-[11px] text-slate-400">Break-Even Offset (Price Units)</div>
                        <input type="number" min="0" max="50" value={trailingStopBreakEvenOffset} onChange={(e) => setTrailingStopBreakEvenOffset(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs w-16 text-right font-mono focus:border-amber-500 focus:outline-none" />
                      </div>
                    )}
                  </>
                )}
              </div>
`;

code = code.replace(/              \{\/\* SL \(Pips\) \*\/\}\n[\s\S]*?<\/div>\n              \}\)\n            <\/div>/m, uiBlock + "\n            </div>");

// Clean up preview panel
code = code.replace(/<div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">[\s\S]*?<\/div>\n            <\/div>/m, `<div className="mt-4 pt-3 border-t border-slate-800 text-center">
               <span className="text-[10px] text-slate-400 font-bold tracking-widest text-emerald-500">DYNAMIC ICT SL/TP (MIN 10 UNITS)</span>
            </div>`);

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
