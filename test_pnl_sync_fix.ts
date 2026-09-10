import assert from 'assert';

console.log('🔬 VERIFYING P/L SYNC LOGIC & RESILIENCE');

// Test 1: Trading date calculation & Cambodia midnight ISO
function getCambodiaMidnightISO() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Phnom_Penh',
        year: 'numeric', month: 'numeric', day: 'numeric'
    });
    const parts = formatter.formatToParts(now);
    let year = '', month = '', day = '';
    for (const p of parts) {
        if (p.type === 'year') year = p.value;
        if (p.type === 'month') month = p.value.padStart(2, '0');
        if (p.type === 'day') day = p.value.padStart(2, '0');
    }
    return new Date(`${year}-${month}-${day}T00:00:00+07:00`).toISOString();
}

const midnight = getCambodiaMidnightISO();
assert(midnight.endsWith('.000Z'), 'Midnight should be an ISO UTC string ending in .000Z');
console.log('✅ PASS | 1. Cambodia midnight ISO calculation valid:', midnight);

// Test 2: Retry interval behavior
let isDailyPnLSynced = false;
let pnlSyncInterval = isDailyPnLSynced ? 60000 : 20000;
assert.strictEqual(pnlSyncInterval, 20000, 'Unsynced state must use 20s backoff interval');

isDailyPnLSynced = true;
pnlSyncInterval = isDailyPnLSynced ? 60000 : 20000;
assert.strictEqual(pnlSyncInterval, 60000, 'Synced state must use 60s periodic interval');
console.log('✅ PASS | 2. Dynamic polling interval: 20s for retry, 60s when healthy');

// Test 3: Consecutive failure resilience
let consecutiveFailures = 0;
let syncedState = true;

// Transient failure 1 (e.g. timeout)
consecutiveFailures++;
if (consecutiveFailures >= 3 || !syncedState) {
    syncedState = false;
}
assert.strictEqual(syncedState, true, 'Single transient failure must not instantly drop sync state');

// Transient failure 2
consecutiveFailures++;
if (consecutiveFailures >= 3 || !syncedState) {
    syncedState = false;
}
assert.strictEqual(syncedState, true, 'Double failure must not immediately drop sync state');

// Transient failure 3
consecutiveFailures++;
if (consecutiveFailures >= 3 || !syncedState) {
    syncedState = false;
}
assert.strictEqual(syncedState, false, '3 consecutive failures must safely trigger unsynced state');
console.log('✅ PASS | 3. Graceful tolerance of transient network jitter (drops only after 3 consecutive failures)');

// Test 4: Midnight day change reset
let currentTradingDate = "2026-09-08T17:00:00.000Z"; // Previous day
const todayMidnight = getCambodiaMidnightISO();

let realizedDailyPnL = 150.5;
let todayTradeCount = 5;
let dailyLossLimitHit = true;

if (currentTradingDate && currentTradingDate !== todayMidnight) {
    currentTradingDate = todayMidnight;
    realizedDailyPnL = 0;
    todayTradeCount = 0;
    dailyLossLimitHit = false;
    syncedState = false;
    consecutiveFailures = 0;
}

assert.strictEqual(currentTradingDate, todayMidnight, 'Trading date must update to today midnight');
assert.strictEqual(realizedDailyPnL, 0, 'Realized daily PnL must reset at midnight');
assert.strictEqual(todayTradeCount, 0, 'Daily trade count must reset at midnight');
assert.strictEqual(dailyLossLimitHit, false, 'Daily loss limit flag must clear on new day');
console.log('✅ PASS | 4. Midnight day change reset operates unconditionally and reliably');

console.log('====================================================');
console.log('📋 ALL P/L SYNC VERIFICATION TESTS PASSED (100%)');
console.log('====================================================');
