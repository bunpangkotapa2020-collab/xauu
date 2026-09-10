const assert = require('assert');

// Mock fetch
global.fetch = async () => {
    return { ok: true, text: async () => "{}" };
};

// Mock global objects
global.botState = {
    account: {
        metaApiAccountId: "acc_123",
        metaApiToken: "tok_123",
        metaApiUrl: "http://mockapi",
        serverConnected: true
    }
};

let telegramCalled = false;
global.daraTelegram = {
    notify: async () => { telegramCalled = true; }
};

// Extract DaRaServerBroker class code from server.ts and eval it inside a wrapper
const fs = require('fs');
const serverCode = fs.readFileSync('server.ts', 'utf8');

const brokerClassMatch = serverCode.match(/class DaRaServerBroker implements DaRaBrokerInterface \{[\s\S]*?\n\}/);
if (!brokerClassMatch) throw new Error("Could not extract DaRaServerBroker");

let classCode = brokerClassMatch[0];
classCode = classCode.replace('implements DaRaBrokerInterface', '');

// Evaluate it
const script = `
${classCode}
module.exports = DaRaServerBroker;
`;
fs.writeFileSync('temp_server_broker.cjs', script);
const DaRaServerBroker = require('./temp_server_broker.cjs');

async function runTests() {
    console.log("Running server broker tests...");
    
    // 2. Bot not RUNNING
    global.daraEngine = { isRunning: true, getUserSettings: () => ({ liveTradingEnabled: false }) };
    const broker = new DaRaServerBroker();
    
    // TEST 1: OFF
    let res = await broker.modifyPosition('tick2', 100, 110);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "HARD BLOCK: liveTradingEnabled is NOT explicitly true. LIVE TRADING IS OFF. Modify aborted.");
    console.log("PASS: liveTradingEnabled false -> BLOCKED");

    // TEST 2: ON
    global.daraEngine = { isRunning: true, getUserSettings: () => ({ liveTradingEnabled: true }) };
    res = await broker.modifyPosition('tick4', 100, 110);
    assert.strictEqual(res.success, true);
    console.log("PASS: liveTradingEnabled true -> ALLOWED");

    console.log("ALL TESTS PASSED SUCCESSFULLY");
}

runTests().catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
});
