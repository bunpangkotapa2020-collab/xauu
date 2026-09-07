const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// 1. Remove it from the bottom
code = code.replace(/        <RiskSettingsPanel botState=\{state\} \/>\n      <\/main>/, "      </main>");

// 2. Add it to the top (after Persistent Bar div closes)
// Let's find the closing tag of the Persistent Bar.
// The Persistent Bar starts with:
//         {/* Persistent Bar */}
//         <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs gap-3">
// And ends where?

// Looking at line 95:
//         {/* Persistent Bar */}
//         <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs gap-3">
//            ...
//            </div>
//         </div>

// The second regex should be robust.
const persistentBarRegex = /\{?\/\*\s*Persistent Bar\s*\*\/\s*\}?\s*<div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs gap-3">[\s\S]*?<\/div>\s*<\/div>/;

const newCode = code.replace(persistentBarRegex, match => {
   return match + "\n\n        <RiskSettingsPanel botState={state} />";
});

if (newCode !== code) {
    fs.writeFileSync('src/components/MainDashboard.tsx', newCode);
    console.log("Successfully moved RiskSettingsPanel");
} else {
    console.log("Failed to match persistent bar");
}

