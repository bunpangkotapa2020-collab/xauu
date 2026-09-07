const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

code = code.replace(/this\.telemetry\.validSetup\.sl = s\.lockedSlTarget;/g, "this.telemetry.validSetup.sl = s.bias === 'BULLISH' ? s.triggerTickPrice - this.config.stopLossDistance : s.triggerTickPrice + this.config.stopLossDistance;");
code = code.replace(/this\.telemetry\.validSetup\.tp = s\.lockedTpTarget;/g, "this.telemetry.validSetup.tp = s.bias === 'BULLISH' ? s.triggerTickPrice + this.config.takeProfitDistance : s.triggerTickPrice - this.config.takeProfitDistance;");

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
