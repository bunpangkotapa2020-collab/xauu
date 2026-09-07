const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const replacement = `
const initialSettings = {
    lotSize: 0.10,
    slDistance: 10,
    tpDistance: 8,
    dailyLossLimit: 2000,
    maxOpenTrades: 4,
    maxConsecutiveSL: 6,
    cooldownMinutes: 20,
    maxSpreadPoints: 25,
    newsFilterEnabled: true,
    newsMinsBefore: 30,
    newsMinsAfter: 30,
    trailingEnabled: true,
    trailingTriggerPips: 15,
    trailingDistancePips: 5
};
global.daraEngine = new DaRaM1Engine(daraBroker, initialSettings, daraTelegram);
`;

code = code.replace(/global\.daraEngine = new DaRaM1Engine\(daraBroker, initialSettings, daraTelegram\);/g, replacement);

fs.writeFileSync('server.ts', code);
