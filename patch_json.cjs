const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'data/bot_config.json');
const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
data.riskConfig.maxOpenTrades = 2;
data.riskConfig.entriesPerSignal = 2;
fs.writeFileSync(p, JSON.stringify(data, null, 2));
