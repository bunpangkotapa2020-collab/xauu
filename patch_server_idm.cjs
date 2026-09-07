const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "if (!m15Data.idm) { console.log(`[NEW EA SMC] FINAL = NO TRADE | REASON = IDM_NOT_CONFIRMED`); return; }",
  "if (m15Data.idm) { console.log(`[NEW EA SMC] IDM = CONFIRMED (Confluence added)`); } else { console.log(`[NEW EA SMC] IDM = NOT_CONFIRMED (Optional)`); }"
);
fs.writeFileSync('server.ts', code);
