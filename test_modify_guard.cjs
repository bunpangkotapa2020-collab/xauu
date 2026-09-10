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
fs.writeFileSync('temp_broker.cjs', script);
const DaRaServerBroker = require('./temp_broker.cjs');

async function runTests() {
    console.log("Running tests...");
    
    // 1. Engine missing
    global.daraEngine = undefined;
    const broker = new DaRaServerBroker();
    let res = await broker.modifyPosition('tick1', 100, 110);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "HARD BLOCK: Engine not initialized.");
    console.log("PASS: Engine missing -> BLOCKED");
    
    // 2. Bot not RUNNING
    global.daraEngine = { isRunning: false, getUserSettings: () => ({}) };
    res = await broker.modifyPosition('tick2', 100, 110);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "HARD BLOCK: Bot is NOT explicitly RUNNING. Modify aborted.");
    console.log("PASS: Bot not RUNNING -> BLOCKED");
    
    // 3. liveTradingEnabled !== true
    global.daraEngine = { isRunning: true, getUserSettings: () => ({ liveTradingEnabled: false }) };
    telegramCalled = false;
    res = await broker.modifyPosition('tick3', 100, 110);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "HARD BLOCK: liveTradingEnabled is NOT explicitly true. LIVE TRADING IS OFF. Modify aborted.");
    assert.strictEqual(telegramCalled, true);
    console.log("PASS: liveTradingEnabled false -> BLOCKED");

    // 4. MetaApi Server not connected
    global.daraEngine = { isRunning: true, getUserSettings: () => ({ liveTradingEnabled: true }) };
    global.botState.account.serverConnected = false;
    res = await broker.modifyPosition('tick4', 100, 110);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "HARD BLOCK: Server is NOT connected.");
    console.log("PASS: MetaApi not connected -> BLOCKED");

    // 5. ALL CHECKS PASS -> ALLOWED
    global.botState.account.serverConnected = true;
    res = await broker.modifyPosition('tick5', 100, 110);
    assert.strictEqual(res.success, true); // Since mock fetch returns success
    console.log("PASS: All checks PASS -> ALLOWED");

    console.log("ALL TESTS PASSED SUCCESSFULLY");
}

runTests().catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
});
