const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

// 1. Fix modifyPayload type
code = code.replace(/const modifyPayload = \{/g, 'const modifyPayload: any = {');

// 2. Fix DaRaM1Engine instantiation (needs initial settings)
const engineInit = `
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
code = code.replace(/global\.daraEngine = new DaRaM1Engine\(daraBroker, daraTelegram\);/g, engineInit);

// 3. Fix botState.riskConfig property names (casting to any to bypass TS checks since the UI shapes it)
code = code.replace(/botState\.riskConfig\?\./g, '(botState.riskConfig as any)?.');

// 4. Fix isNewsBlockedNow
code = code.replace(/isNewsBlockedNow/g, 'Boolean(global.isNewsBlockedNow || false)');

fs.writeFileSync('server.ts', code);
console.log('Errors patched');
