const fs = require('fs');

async function getState() {
  try {
    const res = await fetch('http://localhost:3000/api/bot/state');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("botState.status = " + data.status);
    console.log("botState.desiredBotState = " + data.desiredBotState);
    console.log("LIVE_TRADING_ENABLED = " + data.liveEaConfig.LIVE_TRADING_ENABLED);
    console.log("isMarketOpen = " + data.isMarketOpen);
    console.log("dailyLossLimitHit = " + data.dailyLossLimitHit);
    console.log("isDailyPnLSynced = " + data.isDailyPnLSynced);
    console.log("marketSpeed = " + data.marketSpeed);
  } catch(e) {
    console.error(e.message);
  }
}
getState();
