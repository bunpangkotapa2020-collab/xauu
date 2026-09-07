const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldStart = `      const isMarketSafe = botState.account.isConnected && botState.account.serverConnected && botState.isDailyPnLSynced && !botState.dailyLossLimitHit;
      if (isMarketSafe) {
        
        
      }`;

const newStart = `      const isMarketSafe = botState.account.isConnected && botState.account.serverConnected && botState.isDailyPnLSynced && !botState.dailyLossLimitHit;
      if (isMarketSafe) {
        if (global.daraEngine) global.daraEngine.start();
      }`;

const oldPause = `    } else if (action === 'pause') {`;
const newPause = `    } else if (action === 'pause') {
      if (global.daraEngine) global.daraEngine.stop();`;

const oldStop = `    } else if (action === 'stop') {`;
const newStop = `    } else if (action === 'stop') {
      if (global.daraEngine) global.daraEngine.stop();`;

code = code.replace(oldStart, newStart);
code = code.replace(oldPause, newPause);
code = code.replace(oldStop, newStop);

fs.writeFileSync('server.ts', code);
console.log('patched start and stop');
