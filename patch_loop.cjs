const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `    } else if (!botState.account.isConnected) {
        botState.marketDataStatus = 'WATCHING / WAITING FOR DATA';
    }
}, 3000);`;

const newStr = `    } else if (!botState.account.isConnected) {
        botState.marketDataStatus = 'WATCHING / WAITING FOR DATA';
    }
    
    // Auto-Recovery Tracking
    SelfHealingEngine.checkConnectionState(botState.account.serverConnected);

}, 3000);`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    fs.writeFileSync('server.ts', code);
    console.log('Loop patched successfully.');
} else {
    console.log('Target string not found.');
}
