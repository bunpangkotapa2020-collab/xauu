const fs = require('fs');
const file = 'src/MASTER_ICT_EA.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace("        }\n    }\n    public LIVE_TRADING_ENABLED = false;", "        }\n    public LIVE_TRADING_ENABLED = false;");
fs.writeFileSync(file, code);
