const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

// The live trading block from line 156 to 239 is quite big.
// Let's just create a completely fresh BotSettingsModal.tsx to be safe!
