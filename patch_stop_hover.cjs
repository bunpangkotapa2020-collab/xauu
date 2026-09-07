const fs = require('fs');
let code = fs.readFileSync('src/components/ActionControlsPanel.tsx', 'utf8');

const oldRunText = `                  <div className="font-black text-base md:text-lg text-emerald-300 tracking-wide flex items-center gap-2">
                    <span>🟢 BOT RUNNING</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>`;

const newRunText = `                  <div className="font-black text-base md:text-lg text-emerald-300 group-hover:text-rose-400 tracking-wide flex items-center gap-2 transition-colors">
                    <span className="group-hover:hidden">🟢 BOT RUNNING</span>
                    <span className="hidden group-hover:block">🔴 CLICK TO STOP BOT</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:bg-rose-500 animate-ping"></span>
                  </div>`;

code = code.replace(oldRunText, newRunText);

const oldLostText = `                  <div className="font-black text-base md:text-lg text-amber-500 tracking-wide flex items-center gap-2">
                    <span>⚠️ CONNECTION LOST</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  </div>`;

const newLostText = `                  <div className="font-black text-base md:text-lg text-amber-500 group-hover:text-rose-400 tracking-wide flex items-center gap-2 transition-colors">
                    <span className="group-hover:hidden">⚠️ CONNECTION LOST</span>
                    <span className="hidden group-hover:block">🔴 CLICK TO STOP BOT</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:bg-rose-500 animate-ping"></span>
                  </div>`;

code = code.replace(oldLostText, newLostText);

fs.writeFileSync('src/components/ActionControlsPanel.tsx', code);
console.log('patched hover effect');
