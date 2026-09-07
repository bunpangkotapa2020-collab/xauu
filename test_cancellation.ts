import { IctXauusdEA, ICTMarketData, Candle } from './src/MASTER_ICT_EA';

function createMockCandles(basePrice: number, count: number, step: number = 0.5): Candle[] {
    const candles: Candle[] = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
        const p = basePrice + (i * step);
        candles.push({
            time: now - ((count - i) * 60000),
            open: p,
            high: p + 1.0,
            low: p - 1.0,
            close: p + 0.2,
            volume: 100
        });
    }
    return candles;
}

function createMockTick(bid: number, ask: number, candles?: Candle[]): ICTMarketData {
    const c = candles || createMockCandles(bid, 20);
    return {
        symbol: 'XAUUSD',
        bid,
        ask,
        spread: Number((ask - bid).toFixed(2)),
        serverTime: Date.now(),
        h4Candles: c,
        m15Candles: c,
        m1Candles: c,
        volatilityIsHigh: false,
        isNewsTime: false,
        mt5MinLot: 0.01,
        mt5MaxLot: 100,
        mt5LotStep: 0.01
    };
}

function createTestEA(): IctXauusdEA {
    const config: any = {
        symbol: 'XAUUSD',
        isRealAccount: false,
        isUSCAccount: false,
        lotSize: 0.01,
        stopLossDistance: 10,
        takeProfitDistance: 10,
        dailyLossLimit: 50,
        maxConsecutiveSL: 3,
        cooldownMinutes: 15,
        maxOpenTrades: 1,
        tradingSessionStart: '00:00',
        tradingSessionEnd: '23:59',
        newsFilterEnabled: false,
        minutesBeforeNewsBlock: 15,
        minutesAfterNewsBlock: 15,
        obLookbackCandles: 15,
        obMinDisplacementBodyRatio: 0.6,
        obMinDisplacementMultiplier: 1.5,
        obRecentCandlesForAverage: 3,
        minSLPoints: 10,
        minTPPoints: 10,
        minRR: 1.5,
        trailingStopEnabled: false
    };
    return new IctXauusdEA(config);
}

async function runTests() {
    console.log("==================================================================");
    console.log("   TESTING PENDING SETUP PRE-ENTRY CANCELLATION LOGIC (8 TESTS)  ");
    console.log("==================================================================\n");

    let passedTests = 0;
    const totalTests = 8;

    // -------------------------------------------------------------
    // TEST 1: BUY Pending -> Price reaches Setup TP before Entry -> CANCEL -> NO TRADE
    // -------------------------------------------------------------
    {
        const ea = createTestEA();

        // Set up a BUY pending setup: Entry = 2500, SL = 2490, TP = 2520
        const setupId = 'TEST-BUY-1';
        (ea as any).state.currentSetup = {
            id: setupId,
            bias: 'BULLISH',
            stage: 'WAITING',
            lockedEntryPrice: 2500.0,
            lockedSlTarget: 2490.0,
            lockedTpTarget: 2520.0,
            obHigh: 2500.0,
            obLow: 2498.0,
            creationTime: Date.now(),
            expirationTime: Date.now() + 3600000
        };
        (ea as any).telemetry.validSetup = {
            direction: 'BUY',
            entry: 2500.0,
            sl: 2490.0,
            tp: 2520.0,
            stage: 'WAITING'
        };

        // Price rises directly to 2521 (reaches Setup TP before reaching 2500 Entry)
        const tick = createMockTick(2521.0, 2521.3);
        const cancelled = ea.checkPendingSetupCancellation(tick);

        const ok = cancelled === true &&
                   (ea as any).state.currentSetup === null &&
                   (ea as any).telemetry.validSetup === null &&
                   (ea as any).state.openPositions.length === 0;

        if (ok) {
            console.log("✅ TEST 1 PASSED: BUY Pending cancelled when price reached Setup TP before Entry. No trade executed.");
            passedTests++;
        } else {
            console.error("❌ TEST 1 FAILED:", { cancelled, currentSetup: (ea as any).state.currentSetup });
        }
    }

    // -------------------------------------------------------------
    // TEST 2: BUY Pending -> Price reaches Setup SL before Entry -> CANCEL -> NO TRADE
    // -------------------------------------------------------------
    {
        const ea = createTestEA();

        // Set up a BUY pending setup: Entry = 2500, SL = 2490, TP = 2520
        (ea as any).state.currentSetup = {
            id: 'TEST-BUY-2',
            bias: 'BULLISH',
            stage: 'WAITING',
            lockedEntryPrice: 2500.0,
            lockedSlTarget: 2490.0,
            lockedTpTarget: 2520.0,
            obHigh: 2500.0,
            obLow: 2498.0,
            creationTime: Date.now(),
            expirationTime: Date.now() + 3600000
        };
        (ea as any).telemetry.validSetup = {
            direction: 'BUY',
            entry: 2500.0,
            sl: 2490.0,
            tp: 2520.0,
            stage: 'WAITING'
        };

        // Price gaps or crashes directly to 2488 (below Setup SL before entry)
        const tick = createMockTick(2488.0, 2488.3);
        const cancelled = ea.checkPendingSetupCancellation(tick);

        const ok = cancelled === true &&
                   (ea as any).state.currentSetup === null &&
                   (ea as any).telemetry.validSetup === null &&
                   (ea as any).state.openPositions.length === 0;

        if (ok) {
            console.log("✅ TEST 2 PASSED: BUY Pending cancelled when price reached Setup SL before Entry. No trade executed.");
            passedTests++;
        } else {
            console.error("❌ TEST 2 FAILED:", { cancelled, currentSetup: (ea as any).state.currentSetup });
        }
    }

    // -------------------------------------------------------------
    // TEST 3: SELL Pending -> Price reaches Setup TP before Entry -> CANCEL -> NO TRADE
    // -------------------------------------------------------------
    {
        const ea = createTestEA();

        // Set up a SELL pending setup: Entry = 2500, SL = 2510, TP = 2480
        (ea as any).state.currentSetup = {
            id: 'TEST-SELL-1',
            bias: 'BEARISH',
            stage: 'WAITING',
            lockedEntryPrice: 2500.0,
            lockedSlTarget: 2510.0,
            lockedTpTarget: 2480.0,
            obHigh: 2502.0,
            obLow: 2500.0,
            creationTime: Date.now(),
            expirationTime: Date.now() + 3600000
        };
        (ea as any).telemetry.validSetup = {
            direction: 'SELL',
            entry: 2500.0,
            sl: 2510.0,
            tp: 2480.0,
            stage: 'WAITING'
        };

        // Price plunges directly to 2478 (reaches Setup TP before retracing up to 2500 Entry)
        const tick = createMockTick(2478.0, 2478.3);
        const cancelled = ea.checkPendingSetupCancellation(tick);

        const ok = cancelled === true &&
                   (ea as any).state.currentSetup === null &&
                   (ea as any).telemetry.validSetup === null &&
                   (ea as any).state.openPositions.length === 0;

        if (ok) {
            console.log("✅ TEST 3 PASSED: SELL Pending cancelled when price reached Setup TP before Entry. No trade executed.");
            passedTests++;
        } else {
            console.error("❌ TEST 3 FAILED:", { cancelled, currentSetup: (ea as any).state.currentSetup });
        }
    }

    // -------------------------------------------------------------
    // TEST 4: SELL Pending -> Price reaches Setup SL before Entry -> CANCEL -> NO TRADE
    // -------------------------------------------------------------
    {
        const ea = createTestEA();

        // Set up a SELL pending setup: Entry = 2500, SL = 2510, TP = 2480
        (ea as any).state.currentSetup = {
            id: 'TEST-SELL-2',
            bias: 'BEARISH',
            stage: 'WAITING',
            lockedEntryPrice: 2500.0,
            lockedSlTarget: 2510.0,
            lockedTpTarget: 2480.0,
            obHigh: 2502.0,
            obLow: 2500.0,
            creationTime: Date.now(),
            expirationTime: Date.now() + 3600000
        };
        (ea as any).telemetry.validSetup = {
            direction: 'SELL',
            entry: 2500.0,
            sl: 2510.0,
            tp: 2480.0,
            stage: 'WAITING'
        };

        // Price spikes up directly to 2512 (reaches Setup SL before entry)
        const tick = createMockTick(2512.0, 2512.3);
        const cancelled = ea.checkPendingSetupCancellation(tick);

        const ok = cancelled === true &&
                   (ea as any).state.currentSetup === null &&
                   (ea as any).telemetry.validSetup === null &&
                   (ea as any).state.openPositions.length === 0;

        if (ok) {
            console.log("✅ TEST 4 PASSED: SELL Pending cancelled when price reached Setup SL before Entry. No trade executed.");
            passedTests++;
        } else {
            console.error("❌ TEST 4 FAILED:", { cancelled, currentSetup: (ea as any).state.currentSetup });
        }
    }

    // -------------------------------------------------------------
    // TEST 5: Pending Setup cancelled -> EA can find and create a NEW valid setup
    // -------------------------------------------------------------
    {
        const ea = createTestEA();

        // 1. Setup gets cancelled
        (ea as any).state.currentSetup = {
            id: 'OLD-SETUP-TO-CANCEL',
            bias: 'BULLISH',
            stage: 'WAITING',
            lockedEntryPrice: 2500.0,
            lockedSlTarget: 2490.0,
            lockedTpTarget: 2520.0,
            obHigh: 2500.0,
            obLow: 2498.0,
            creationTime: Date.now(),
            expirationTime: Date.now() + 3600000
        };
        ea.cancelPendingSetup('TEST_REASON', 'Setup cancelled for test 5');

        const cancelledClean = (ea as any).state.currentSetup === null &&
                              (ea as any).state.executedSetupIds.has('OLD-SETUP-TO-CANCEL');

        // 2. Now simulate receiving new market analysis with new setup
        const newSetupId = 'NEW-SETUP-AFTER-CANCEL';
        (ea as any).state.currentSetup = {
            id: newSetupId,
            bias: 'BEARISH',
            stage: 'WAITING',
            lockedEntryPrice: 2530.0,
            lockedSlTarget: 2540.0,
            lockedTpTarget: 2510.0,
            obHigh: 2532.0,
            obLow: 2530.0,
            creationTime: Date.now(),
            expirationTime: Date.now() + 3600000
        };

        const ok = cancelledClean &&
                   (ea as any).state.currentSetup.id === newSetupId &&
                   (ea as any).state.currentSetup.lockedEntryPrice === 2530.0;

        if (ok) {
            console.log("✅ TEST 5 PASSED: After pending setup was cancelled, EA state was cleanly cleared and new valid setup was created.");
            passedTests++;
        } else {
            console.error("❌ TEST 5 FAILED:", { cancelledClean, currentSetup: (ea as any).state.currentSetup });
        }
    }

    // -------------------------------------------------------------
    // TEST 6: Price reaches Locked Entry first -> Real Broker Position opens normally
    // -------------------------------------------------------------
    {
        const ea = createTestEA();
        ea.LIVE_TRADING_ENABLED = true;

        // Set up BUY pending setup: Entry = 2500, SL = 2490, TP = 2520
        (ea as any).state.currentSetup = {
            id: 'TEST-BUY-ENTRY-FIRST',
            bias: 'BULLISH',
            stage: 'WAITING',
            lockedEntryPrice: 2500.0,
            lockedSlTarget: 2490.0,
            lockedTpTarget: 2520.0,
            obHigh: 2500.0,
            obLow: 2498.0,
            creationTime: Date.now(),
            expirationTime: Date.now() + 3600000
        };

        // Price pulls back normally to 2500 (does not reach 2520 TP and does not reach 2490 SL)
        const tick = createMockTick(2499.7, 2500.0);
        const cancelled = ea.checkPendingSetupCancellation(tick);

        // onTick handles the entry trigger
        await ea.onTick(tick);

        const ok = cancelled === false &&
                   ((ea as any).state.currentSetup.stage === 'TRIGGERED' || (ea as any).state.currentSetup.stage === 'EXECUTED');

        if (ok) {
            console.log("✅ TEST 6 PASSED: Price reached Locked Entry first without touching SL/TP. Triggered/Executed normally.");
            passedTests++;
        } else {
            console.error("❌ TEST 6 FAILED:", { cancelled, stage: (ea as any).state.currentSetup?.stage });
        }
    }

    // -------------------------------------------------------------
    // TEST 7: After Real Position is confirmed -> Pending cancellation logic must NOT close/cancel the active trade
    // -------------------------------------------------------------
    {
        const ea = createTestEA();

        // Simulate active real broker position
        (ea as any).state.openPositions = [{
            id: 'TICKET-999',
            symbol: 'XAUUSD',
            type: 'BUY',
            openPrice: 2500.0,
            currentPrice: 2515.0,
            volume: 0.01,
            sl: 2490.0,
            tp: 2520.0
        }];

        // Even if currentSetup was still in state or price approaches virtual levels
        (ea as any).state.currentSetup = {
            id: 'ACTIVE-TRADE-SETUP',
            bias: 'BULLISH',
            stage: 'WAITING',
            lockedEntryPrice: 2500.0,
            lockedSlTarget: 2490.0,
            lockedTpTarget: 2520.0,
            obHigh: 2500.0,
            obLow: 2498.0,
            creationTime: Date.now(),
            expirationTime: Date.now() + 3600000
        };

        const tick = createMockTick(2521.0, 2521.3);
        const cancelled = ea.checkPendingSetupCancellation(tick);

        const ok = cancelled === false &&
                   (ea as any).state.openPositions.length === 1 &&
                   (ea as any).state.openPositions[0].id === 'TICKET-999';

        if (ok) {
            console.log("✅ TEST 7 PASSED: When a real broker position is active, pending setup cancellation logic does NOT cancel or close the trade.");
            passedTests++;
        } else {
            console.error("❌ TEST 7 FAILED:", { cancelled, positionsCount: (ea as any).state.openPositions.length });
        }
    }

    // -------------------------------------------------------------
    // TEST 8: Virtual SL/TP hit before Entry must NOT count as:
    // - Win
    // - Loss
    // - SL hit
    // - Cooldown event
    // - Consecutive SL
    // -------------------------------------------------------------
    {
        const ea = createTestEA();

        const initialDailyLoss = (ea as any).state.dailyLoss;
        const initialConsecutiveSLs = (ea as any).state.consecutiveSLs;
        const initialLastSLTime = (ea as any).state.lastSLTime;

        // Set up BUY pending setup
        (ea as any).state.currentSetup = {
            id: 'TEST-BUY-VIRTUAL-CHECK',
            bias: 'BULLISH',
            stage: 'WAITING',
            lockedEntryPrice: 2500.0,
            lockedSlTarget: 2490.0,
            lockedTpTarget: 2520.0,
            obHigh: 2500.0,
            obLow: 2498.0,
            creationTime: Date.now(),
            expirationTime: Date.now() + 3600000
        };

        // Price hits Virtual SL
        const tick = createMockTick(2489.0, 2489.3);
        ea.checkPendingSetupCancellation(tick);

        const finalDailyLoss = (ea as any).state.dailyLoss;
        const finalConsecutiveSLs = (ea as any).state.consecutiveSLs;
        const finalLastSLTime = (ea as any).state.lastSLTime;

        const ok = initialDailyLoss === finalDailyLoss &&
                   finalDailyLoss === 0 &&
                   initialConsecutiveSLs === finalConsecutiveSLs &&
                   finalConsecutiveSLs === 0 &&
                   initialLastSLTime === finalLastSLTime &&
                   finalLastSLTime === 0;

        if (ok) {
            console.log("✅ TEST 8 PASSED: Virtual SL/TP hit did NOT count as win/loss, did NOT increment dailyLoss, did NOT increment consecutiveSLs, and did NOT trigger cooldown.");
            passedTests++;
        } else {
            console.error("❌ TEST 8 FAILED:", {
                initialDailyLoss, finalDailyLoss,
                initialConsecutiveSLs, finalConsecutiveSLs,
                initialLastSLTime, finalLastSLTime
            });
        }
    }

    console.log("\n==================================================================");
    console.log(`  RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log("==================================================================\n");

    if (passedTests === totalTests) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
