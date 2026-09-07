const fs = require('fs');

let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

// 1. Update imports
code = code.replace(
  /import \{ Settings, ShieldAlert, FileText, CheckCircle2 \} from 'lucide-react';/,
  "import { Settings, ShieldAlert, FileText, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';"
);

// 2. Add state
code = code.replace(
  /export function RiskSettingsPanel\(\{ botState \}: RiskSettingsPanelProps\) \{/,
  "export function RiskSettingsPanel({ botState }: RiskSettingsPanelProps) {\n  const [isExpanded, setIsExpanded] = useState(false);"
);

// 3. Update header
const oldHeader = `<div className="flex items-center gap-2 mb-5">
        <Settings className="text-amber-500 w-5 h-5" />
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
          ⚙️ LOT SIZE & ENTRY SETTINGS
        </h2>
      </div>`;
      
const newHeader = `<button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Settings className="text-amber-500 w-5 h-5" />
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            ⚙️ LOT SIZE & ENTRY SETTINGS
          </h2>
        </div>
        {isExpanded ? <ChevronUp className="text-slate-400 w-5 h-5" /> : <ChevronDown className="text-slate-400 w-5 h-5" />}
      </button>`;

code = code.replace(oldHeader, newHeader);

// 4. Wrap content
code = code.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/,
  `{isExpanded && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5 border-t border-slate-800/50 pt-5">`
);

// We need to close the isExpanded check. 
// Find the last </div></div></div> (or whatever the end is)
// It ends with:
//         </div>
//       </div>
//     </div>
//   );
// }

code = code.replace(
  /      <\/div>\n    <\/div>\n  \);\n\}/,
  `      </div>\n      )}\n    </div>\n  );\n}`
);

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
