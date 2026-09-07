const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const regex = /\s*<button onClick=\{handleComingSoon\} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shrink-0">\s*<SlidersHorizontal size=\{18\} \/>\s*<\/button>\s*<button onClick=\{handleComingSoon\} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shrink-0">\s*<Key size=\{18\} \/>\s*<\/button>\s*<button onClick=\{\(\) => window\.open\('\/api\/bot\/download\/ea'\)\} className="flex items-center gap-2 px-3 py-1\.5 text-amber-400 hover:text-amber-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors text-sm shrink-0">\s*<Download size=\{16\} \/> EA\s*<\/button>/g;

code = code.replace(regex, "");

fs.writeFileSync('src/components/MainDashboard.tsx', code);
