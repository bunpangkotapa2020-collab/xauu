const fs = require('fs');
const http = require('http');

const LOG_FILE = 'long_run_audit.log';
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(line.trim());
}

log("=== RESTARTING LONG-RUN STABILITY MONITOR WITH CORRECT FIELDS ===");
let flapCount = 0;
let lastState = null;
let consecutiveErrors = 0;

setInterval(() => {
  http.get('http://localhost:3000/api/bot/state', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const state = JSON.parse(data);
        const tickAge = Date.now() - (state.lastTickTime || 0);
        const isMt5Yes = state.account && state.account.serverConnected;
        
        let staleWarning = '';
        if (tickAge > 10000) {
            staleWarning = `[WARNING: STALE DATA ${tickAge}ms]`;
        }

        if (lastState !== null && lastState.account && state.account) {
            if (lastState.account.serverConnected !== state.account.serverConnected) {
                flapCount++;
                log(`[FLAP DETECTED] MT5 Conn: ${lastState.account.serverConnected} -> ${state.account.serverConnected}`);
            }
        }

        log(`Status=${state.status} | MT5=${isMt5Yes?'YES':'NO'} | TickAge=${tickAge}ms ${staleWarning} | Ask=${state.askPrice} | Flaps=${flapCount}`);
        
        lastState = state;
        consecutiveErrors = 0;
      } catch (e) {
        log(`[ERROR] JSON Parse Error: ${e.message}`);
      }
    });
  }).on('error', (err) => {
    consecutiveErrors++;
    log(`[ERROR] Request failed: ${err.message} (x${consecutiveErrors})`);
  });
}, 10000);
