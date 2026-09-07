const fs = require('fs');
let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

const slTpInputs = `
              {/* Stop Loss & Take Profit */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-300 font-medium">Stop Loss (Distance):</div>
                  <div className="text-[10px] text-slate-500">គម្លាតពីតម្លៃ Entry គិតជា Points (មាស)</div>
                </div>
                <input 
                  type="number" 
                  min="1"
                  step="0.01"
                  value={slPips} 
                  onChange={(e) => setSlPips(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-20 text-right font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-300 font-medium">Take Profit (Distance):</div>
                  <div className="text-[10px] text-slate-500">គម្លាតពីតម្លៃ Entry គិតជា Points (មាស)</div>
                </div>
                <input 
                  type="number" 
                  min="1"
                  step="0.01"
                  value={tpPips} 
                  onChange={(e) => setTpPips(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-20 text-right font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>
`;

if (!code.includes('Stop Loss (Distance):')) {
    code = code.replace(/<div className="bg-slate-950\/50 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">\s*<div>\s*<div className="text-xs text-slate-300 font-medium">Max Open Trades \(Bot\):<\/div>[\s\S]*?<\/div>\s*<\/div>/, match => match + slTpInputs);
    fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
}
