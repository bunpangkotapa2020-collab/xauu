const fs = require('fs');
const filePath = 'src/components/BotSettingsModal.tsx';

if (!fs.existsSync(filePath)) {
  console.log("File not found:", filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('additionalEntryDistance')) {
  console.log("ALREADY_PATCHED");
  process.exit(0);
}

content = content.replace(
  "const [maxTrades, setMaxTrades] = useState('4');",
  "const [maxTrades, setMaxTrades] = useState('4');\n  const [additionalEntryDistance, setAdditionalEntryDistance] = useState('4.0');"
);

content = content.replace(
  "if (botState.riskConfig.maxOpenTrades !== undefined) setMaxTrades(String(botState.riskConfig.maxOpenTrades));",
  "if (botState.riskConfig.maxOpenTrades !== undefined) setMaxTrades(String(botState.riskConfig.maxOpenTrades));\n        if ((botState.riskConfig as any).additionalEntryDistance !== undefined) setAdditionalEntryDistance(String((botState.riskConfig as any).additionalEntryDistance));"
);

content = content.replace(
  "maxOpenTrades: parsedTrades,",
  "maxOpenTrades: parsedTrades,\n        additionalEntryDistance: Number(additionalEntryDistance) || 4.0,"
);

const targetUI = `<div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs text-slate-400 mb-1">Max Open Trades / ចំនួន Trade អតិបរមា</label>
              <input 
                type="number" step="1" min="1"
                value={maxTrades} onChange={(e) => setMaxTrades(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
            </div>`;

const newUI = targetUI + `\n
            {/* ADDITIONAL ENTRY DISTANCE */}
            <div className="bg-slate-800/30 border border-blue-900/40 bg-blue-950/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-blue-300 font-semibold">Additional Entry (Raw Price) / ចម្ងាយថែម Trade</label>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Scale-in</span>
              </div>
              <input 
                type="number" step="0.1" min="0.1"
                value={additionalEntryDistance} onChange={(e) => setAdditionalEntryDistance(e.target.value)}
                placeholder="4.0"
                className="w-full bg-slate-900 border border-blue-600/50 focus:border-blue-400 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">បើក Trade បន្ថែមនៅពេលតម្លៃដើរខុស 4.0$ (Max Trades ត្រូវ ≥ 2)</p>
            </div>`;

content = content.replace(targetUI, newUI);
fs.writeFileSync(filePath, content);
console.log("PATCHED_SUCCESSFULLY");
