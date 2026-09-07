const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');
code = code.replace(
    "if (!this.state.currentSetup || this.state.currentSetup.stage === 'INVALIDATED') {",
    "if (this.state.currentSetup && data.serverTime > this.state.currentSetup.expirationTime) {\n            this.log(`STALE SETUP: Setup ${this.state.currentSetup.id} expired. Stage -> INVALIDATED`);\n            this.state.currentSetup.stage = 'INVALIDATED';\n        }\n\n        if (!this.state.currentSetup || this.state.currentSetup.stage === 'INVALIDATED') {"
);
fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
