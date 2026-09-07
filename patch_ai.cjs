const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const failSafes = `
  if (!botState.isDailyPnLSynced) {
      botState.statusMessageKhmer = '⚠️ DAILY P/L UNKNOWN / RISK CHECK PAUSED — រង់ចាំទាញយកប្រវត្តិ P/L...';
      return;
  }
  
  if (botState.dailyLossLimitHit) {
      // Message is already set in the 3s loop
      return;
  }
`;

code = code.replace(
    "  if (eaState.consecutiveLosses >= eaState.maxConsecutiveLosses) {",
    failSafes + "\n  if (eaState.consecutiveLosses >= eaState.maxConsecutiveLosses) {"
);

fs.writeFileSync('server.ts', code);
