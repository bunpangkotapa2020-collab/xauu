const fs = require('fs');

let content = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// Replace return; with this.state.executedSetupIds.add(s.id); return; for risk checks
content = content.replace(/s\.stage = 'INVALIDATED';\n                return;/g, 
  "s.stage = 'INVALIDATED';\n                this.state.executedSetupIds.add(s.id);\n                return;");

fs.writeFileSync('src/MASTER_ICT_EA.ts', content);
