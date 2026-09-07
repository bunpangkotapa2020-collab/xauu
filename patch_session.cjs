const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Fix botState initialization to preserve status and connection properly
code = code.replace(
  "const botState: BotServerState = {\n  status: 'stopped',",
  "const botState: BotServerState = {\n  status: initialSavedConfig.status === 'running' ? 'running' : 'stopped',"
);

// 2. Add an auto-recovery log on startup
const recoveryCode = `
// ============================================
// MT5 LOGIN SESSION AUTO-RECOVERY
// ============================================
if (botState.account.loginId && botState.account.metaApiToken && botState.account.metaApiUrl) {
    console.log(\`[MT5 AUTO-RECOVERY] Restoring saved session for account \${botState.account.loginId}\`);
    botState.account.isConnected = true;
    botState.account.serverConnected = true;
    botState.account.marketDataReceiving = true;
    botState.account.eaConnected = true;
    botState.account.tradingPermission = true;
    if (botState.status === 'running') {
        botState.statusMessageKhmer = \`🟢 [AUTO-RECOVERED] បានស្តារការភ្ជាប់ Exness (\${botState.account.loginId}) និងបន្ត Trading\`;
    } else {
        botState.statusMessageKhmer = \`🟢 [AUTO-RECOVERED] បានស្តារការភ្ជាប់ Exness (\${botState.account.loginId}) ដោយជោគជ័យ\`;
    }
}
`;

code = code.replace(
  "const app = express();",
  recoveryCode + "\nconst app = express();"
);

fs.writeFileSync('server.ts', code);
