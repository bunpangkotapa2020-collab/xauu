const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "      botState.account = {\n        accountType: cleanType,\n        server: cleanServer,",
  "      botState.account = {\n        ...botState.account,\n        accountType: cleanType,\n        server: cleanServer,"
);

fs.writeFileSync('server.ts', code);
