const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf-8');

const regex = /<span className="text-slate-500">EA Status<\/span>\s*\{isRunning \? \([\s\S]*?\) : \([\s\S]*?\) : \([\s\S]*?🔴 ALL TRADES CLOSED[\s\S]*?\) \}\s*<\/div>/;

// Actually let's just replace the exact block.
