const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// 1. Remove the Tabs
const tabStart = code.indexOf("{/* Tab Navigation: Login vs Setup Custom Credentials */}");
const tabEnd = code.indexOf("{/* ========================================================\n            TAB 1: REGULAR LOGIN FORM\n        ======================================================== */}");
if (tabStart !== -1 && tabEnd !== -1) {
    code = code.substring(0, tabStart) + code.substring(tabEnd);
}

// 2. Remove the {activeTab === 'login' && ( wrapper around the login form
code = code.replace("{activeTab === 'login' && (", "");
code = code.replace("          </div>\n        )}", "          </div>");
code = code.replace("TAB 1: REGULAR LOGIN FORM", "LOGIN FORM");

// 3. Remove the setup form completely
const setupStart = code.indexOf("{/* ========================================================\n            TAB 2: CUSTOM ADMIN SETUP (OWNER DEFINES USERNAME & PASSWORD)\n        ======================================================== */}");
const setupEnd = code.indexOf("{/* Add Shortcut / Install App Icon Button */}");
if (setupStart !== -1 && setupEnd !== -1) {
    code = code.substring(0, setupStart) + code.substring(setupEnd);
}

// 4. Remove shortcut button
const shortcutStart = code.indexOf("{/* Add Shortcut / Install App Icon Button */}");
const shortcutEnd = code.indexOf("{/* Owner Security Guarantee Checklist */}");
if (shortcutStart !== -1 && shortcutEnd !== -1) {
    code = code.substring(0, shortcutStart) + code.substring(shortcutEnd);
}

// 5. Update Security Policy Checklist
const oldChecklist = `        {/* Owner Security Guarantee Checklist */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-1.5 text-[10px] sm:text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate text-emerald-300 font-semibold">
            <Server size={12} className="text-emerald-400 shrink-0" />
            <span className="truncate">🟢 Exness MT5 Real Account 100% (Real Money Live)</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 size={12} className="text-amber-400 shrink-0" />
            <span className="truncate"><strong>Personal Bot:</strong> ប្រើតែម្នាក់ឯង គ្មាន User Registration</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
            <span className="truncate"><strong>Security:</strong> PBKDF2 Password Hash (គ្មាន Plain Text ឡើយ)</span>
          </div>
        </div>`;

const newChecklist = `        {/* Owner Security Guarantee Checklist */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-[10px] sm:text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck size={14} className="shrink-0" />
            <span>SECURITY POLICY (DISPLAY ONLY)</span>
          </div>
          <div className="flex items-center gap-2">
            <Server size={12} className="shrink-0 text-slate-500" />
            <span>Exness MT5 Real Account 100%</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={12} className="shrink-0 text-slate-500" />
            <span>Encrypted Authentication & Session</span>
          </div>
        </div>`;

code = code.replace(oldChecklist, newChecklist);

fs.writeFileSync('src/components/LoginView.tsx', code);
