const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add a lock and change interval
let findStr = `let lastAccountInfoTime = 0;
let lastPositionsTime = 0;

// REAL MT5 Polling Loop (ultra-low latency live quotes & periodic account sync)
setInterval(async () => {
    monitorSystemTransitions();`;

let replaceStr = `let lastAccountInfoTime = 0;
let lastPositionsTime = 0;
let isPollingMT5 = false;

// REAL MT5 Polling Loop (ultra-low latency live quotes & periodic account sync)
setInterval(async () => {
    if (isPollingMT5) return;
    isPollingMT5 = true;
    try {
        monitorSystemTransitions();`;

code = code.replace(findStr, replaceStr);

let findStr2 = `            if (consecutivePollingFailures >= 20 && (Date.now() - lSeen > 120000)) {
                botState.account.serverConnected = false;
                botState.account.marketDataReceiving = false;
            }
        }
    }
}, 1500);`;

let replaceStr2 = `            if (consecutivePollingFailures >= 20 && (Date.now() - lSeen > 120000)) {
                botState.account.serverConnected = false;
                botState.account.marketDataReceiving = false;
            }
        }
    }
    } finally {
        isPollingMT5 = false;
    }
}, 2500);`;

code = code.replace(findStr2, replaceStr2);

fs.writeFileSync('server.ts', code);
console.log("Patched polling interval and lock");
