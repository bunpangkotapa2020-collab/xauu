import fetch from 'node-fetch';
import fs from 'fs';

const LOG_FILE = './stability_30min.log';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {}
}

async function runVerification() {
  log("=== STARTING 30-MINUTE LIVE STABILITY VERIFICATION ===");

  // 1. Authenticate
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "password123" })
  }).then(r => r.json());
  const token = loginRes.token;

  // 2. BEFORE START SNAPSHOT
  const sBefore = await fetch("http://localhost:3000/api/bot/state").then(r => r.json());
  log(`BEFORE START SNAPSHOT: Status=${sBefore.status}, MT5=${sBefore.account?.serverConnected ? "YES" : "NO"}, EA=${sBefore.account?.eaConnected ? "YES" : "NO"}, MetaApi=${sBefore.account?.isConnected ? "CONNECTED" : "DISCONNECTED"}, Feed=${sBefore.account?.marketDataReceiving ? "LIVE" : "DEAD"}, Price=${sBefore.goldPrice}`);

  // 3. TRIGGER START BOT
  log("Triggering START BOT action...");
  const startRes = await fetch("http://localhost:3000/api/bot/action", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ action: "start" })
  }).then(r => r.json());
  log(`START ACTION RESULT: success=${startRes.success}, status=${startRes.state?.status}`);

  const sStart = await fetch("http://localhost:3000/api/bot/state").then(r => r.json());
  log(`EXACT START SNAPSHOT: Status=${sStart.status}, MT5=${sStart.account?.serverConnected ? "YES" : "NO"}, EA=${sStart.account?.eaConnected ? "YES" : "NO"}, Feed=${sStart.account?.marketDataReceiving ? "LIVE" : "DEAD"}, DesiredState=${sStart.desiredBotState}`);

  // Metrics trackers
  let totalSamples = 0;
  let flapCount = 0;
  let disconnectCount = 0;
  let http429Count = 0;
  let lastMt5 = sStart.account?.serverConnected;
  let lastEa = sStart.account?.eaConnected;

  const startTime = Date.now();
  const targetDurationMs = 30 * 60 * 1000; // 30 minutes
  let last10MinLogged = 0;
  let last20MinLogged = 0;
  let last30MinLogged = 0;

  // Sample every 5 seconds for 30 minutes (360 samples)
  while (Date.now() - startTime < targetDurationMs) {
    await new Promise(r => setTimeout(r, 5000));
    totalSamples++;
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    const elapsedMin = Math.floor(elapsedSec / 60);

    try {
      const s = await fetch("http://localhost:3000/api/bot/state").then(r => r.json());
      const mt5 = s.account?.serverConnected;
      const ea = s.account?.eaConnected;
      const isConn = s.account?.isConnected;
      const feed = s.account?.marketDataReceiving;
      const tickAgeMs = Date.now() - (s.lastMt5TickTime || s.lastTickTime || 0);

      // Check flap
      if (mt5 !== lastMt5 || ea !== lastEa) {
        flapCount++;
        log(`[WARNING: FLAP DETECTED at ${elapsedSec}s] MT5: ${lastMt5} -> ${mt5} | EA: ${lastEa} -> ${ea}`);
      }
      if (!mt5 || !ea || !isConn) {
        disconnectCount++;
      }

      lastMt5 = mt5;
      lastEa = ea;

      // 10-minute snapshot
      if (elapsedMin >= 10 && !last10MinLogged) {
        last10MinLogged = 1;
        log(`>>> 10-MINUTE CHECKPOINT: Status=${s.status}, MT5=${mt5 ? "YES" : "NO"}, EA=${ea ? "YES" : "NO"}, Feed=${feed ? "LIVE" : "DEAD"}, Bid=${s.bidPrice}, Ask=${s.askPrice}, TickAge=${tickAgeMs}ms, FlapsSoFar=${flapCount}, Disconnects=${disconnectCount}`);
      }

      // 20-minute snapshot
      if (elapsedMin >= 20 && !last20MinLogged) {
        last20MinLogged = 1;
        log(`>>> 20-MINUTE CHECKPOINT: Status=${s.status}, MT5=${mt5 ? "YES" : "NO"}, EA=${ea ? "YES" : "NO"}, Feed=${feed ? "LIVE" : "DEAD"}, Bid=${s.bidPrice}, Ask=${s.askPrice}, TickAge=${tickAgeMs}ms, FlapsSoFar=${flapCount}, Disconnects=${disconnectCount}`);
      }

      // Periodic logging every 1 minute
      if (totalSamples % 12 === 0) {
        log(`[T+${elapsedMin}m] MT5=${mt5 ? "YES" : "NO"} | EA=${ea ? "YES" : "NO"} | Conn=${isConn ? "OK" : "ERR"} | Feed=${feed ? "LIVE" : "DEAD"} | Price=${s.goldPrice} | TickAge=${tickAgeMs}ms | Flaps=${flapCount}`);
      }
    } catch (e) {
      log(`[ERROR sampling state]: ${e.message}`);
    }
  }

  // 30-MINUTE FINAL CHECKPOINT
  const sFinal = await fetch("http://localhost:3000/api/bot/state").then(r => r.json());
  log(`>>> 30-MINUTE FINAL CHECKPOINT: Status=${sFinal.status}, MT5=${sFinal.account?.serverConnected ? "YES" : "NO"}, EA=${sFinal.account?.eaConnected ? "YES" : "NO"}, Feed=${sFinal.account?.marketDataReceiving ? "LIVE" : "DEAD"}, Bid=${sFinal.bidPrice}, Ask=${sFinal.askPrice}, TotalFlaps=${flapCount}, TotalDisconnects=${disconnectCount}, OpenTrades=${(sFinal.openTrades || []).length}`);

  log("=== 30-MINUTE VERIFICATION COMPLETE ===");
}

runVerification().catch(e => log(`FATAL ERROR: ${e.message}`));
