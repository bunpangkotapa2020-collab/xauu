const fs = require('fs');
async function getSpread() {
  const res = await fetch('http://localhost:3000/api/bot/state');
  const data = await res.json();
  console.log("spreadPoints: " + data.spreadPoints);
  console.log("maxSpreadPoints: " + data.riskConfig.maxSpreadPoints);
}
getSpread();
