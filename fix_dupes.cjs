const fs = require('fs');
let panel = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

const regex = /  const activeTrade = botState\?\.openTrades\?\.\[0\];\n  const activeSide = activeTrade\?\.side \|\| botState\?\.signalDetails\?\.side \|\| '';\n  const activeEntry = activeTrade\?\.entryPrice \|\| botState\?\.signalDetails\?\.entry \|\| 0;\n  const activeSL = activeTrade\?\.sl \|\| botState\?\.signalDetails\?\.sl \|\| 0;\n  const activeTP = activeTrade\?\.tp \|\| botState\?\.signalDetails\?\.tp \|\| 0;\n  const activeRR = \(activeEntry && activeSL && activeTP\) \n    \? \(Math.abs\(activeTP - activeEntry\) \/ Math.abs\(activeEntry - activeSL\)\)\n    : 0;/;

// By replacing the first occurrence with empty, we leave the second one intact.
panel = panel.replace(regex, "");

fs.writeFileSync('src/components/BotSettingsModal.tsx', panel);
