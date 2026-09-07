const fs = require('fs');
let code = fs.readFileSync('src/components/ActionControlsPanel.tsx', 'utf-8');

code = code.replace(
  "<span>{actionResult.status === 'success' ? 'ALL BOT TRADES CLOSED (NEW ENTRIES BLOCKED)' : 'CLOSE ALL FAILED'}</span>",
  "<span>{actionResult.status === 'success' ? '🔴 ALL TRADES CLOSED' : 'CLOSE ALL FAILED'}</span>"
);

fs.writeFileSync('src/components/ActionControlsPanel.tsx', code);
console.log('Updated ActionControlsPanel.tsx');
