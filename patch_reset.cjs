const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const resetReplacement = `
    } else if (action === 'reset_daily_limit') {
      botState.dailyLossLimitHit = false;
      botState.todayProfitLoss = 0;
      botState.realizedDailyPnL = 0;
      botState.isDailyPnLSynced = false;
      // Use current time as the new start time to ignore past losses for today
      botState.currentTradingDate = new Date().toISOString(); 
      botState.status = 'stopped';
      botState.statusMessageKhmer = 'បានកំណត់កម្រិតខាតប្រចាំថ្ងៃឡើងវិញ (Reset Daily Loss)';
      saveBotConfig();
    }
`;

code = code.replace(
    "    } else if (action === 'reset_daily_limit') {\n      botState.dailyLossLimitHit = false;\n      botState.todayProfitLoss = 0;\n      botState.status = 'stopped';\n      botState.statusMessageKhmer = 'បានកំណត់កម្រិតខាតប្រចាំថ្ងៃឡើងវិញ (Reset Daily Loss)';\n      saveBotConfig();\n    }",
    resetReplacement
);

fs.writeFileSync('server.ts', code);
