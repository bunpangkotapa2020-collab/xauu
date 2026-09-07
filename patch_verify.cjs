const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Inside verify-and-connect-mt5, around line 1040 (botState.account assignment)
// we should call updateEnvVariable('MT5_API_KEY', apiKey) and updateEnvVariable('MT5_BRIDGE_URL', bridgeUrl)
// Also store MT5_PASSWORD

const hookStr = `      // Update bot state with REAL connection metrics (WITHOUT storing password)`;
const hookReplacement = `      // Persist secure credentials to .env (backend only)
      updateEnvVariable('MT5_BRIDGE_URL', bridgeUrl);
      updateEnvVariable('MT5_API_KEY', apiKey);
      if (password) updateEnvVariable('MT5_PASSWORD', password);

      // Update bot state with REAL connection metrics (WITHOUT storing password)`;

if (code.includes(hookStr) && !code.includes('updateEnvVariable(\'MT5_BRIDGE_URL\', bridgeUrl)')) {
  code = code.replace(hookStr, hookReplacement);
  fs.writeFileSync('server.ts', code);
  console.log('Patched verify-and-connect-mt5');
} else {
  console.log('Hook not found or already patched');
}
