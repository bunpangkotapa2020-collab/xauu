const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /verifiedFreeMargin = Number\(info\.freeMargin \|\| verifiedBalance\);\s+bridgeConnected = true;/;

const replacement = `verifiedFreeMargin = Number(info.freeMargin || verifiedBalance);
                  if (info.tradeAllowed !== undefined) verifiedTradingAllowed = info.tradeAllowed;
                  bridgeConnected = true;`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log('Patched verifiedTradingAllowed');
} else {
  console.log('Regex did not match for verifiedTradingAllowed');
}
