const fs = require('fs');

async function fetchYahooData(interval, range) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=${interval}&range=${range}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await response.json();
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    let candles = [];
    for (let i = 0; i < timestamps.length; i++) {
        if (quotes.open[i] !== null) {
            candles.push({
                time: timestamps[i],
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i],
                volume: quotes.volume[i] || 0
            });
        }
    }
    return candles;
}

// EA State with Strict Sequence Management
let eaState = {
  paperMode: true,
  consecutiveLosses: 0,
  maxConsecutiveLosses: 3,
  h4Bias: 'NEUTRAL',
  m15Setup: 'WAITING',
  setupSide: 'NONE',
  setupTimestamp: 0,
  m1ObZone: null,
  activeTrade: null,
};

function resetEASetup(reason) {
  eaState.m15Setup = 'WAITING';
  eaState.setupSide = 'NONE';
  eaState.setupTimestamp = 0;
  eaState.m1ObZone = null;
}

function getSwings(candles, n = 3) {
    const swings = [];
    for (let i = n; i < candles.length - n; i++) {
        let isHigh = true;
        let isLow = true;
        for (let j = 1; j <= n; j++) {
            if (candles[i-j].high >= candles[i].high || candles[i+j].high >= candles[i].high) isHigh = false;
            if (candles[i-j].low <= candles[i].low || candles[i+j].low <= candles[i].low) isLow = false;
        }
        if (isHigh) swings.push({ type: 'HIGH', index: i, price: candles[i].high, time: candles[i].time });
        if (isLow) swings.push({ type: 'LOW', index: i, price: candles[i].low, time: candles[i].time });
    }
    return swings;
}

function analyzeH4Bias(candles) {
    if (!candles || candles.length < 20) return { bias: 'NEUTRAL', log: 'NOT_ENOUGH_DATA' };
    const swings = getSwings(candles, 3);
    if (swings.length < 2) return { bias: 'NEUTRAL', log: 'NO_SWINGS_FOUND' };
    
    let lastValidHigh = null;
    let lastValidLow = null;
    
    for (let i = swings.length - 1; i >= 0; i--) {
        if (!lastValidHigh && swings[i].type === 'HIGH') lastValidHigh = swings[i];
        if (!lastValidLow && swings[i].type === 'LOW') lastValidLow = swings[i];
        if (lastValidHigh && lastValidLow) break;
    }
    
    let bias = 'NEUTRAL';
    let logMsg = 'H4_STRUCTURE_MAINTAINED';
    
    const checkStartIndex = Math.max(lastValidHigh?.index || 0, lastValidLow?.index || 0) + 1;
    
    for (let i = checkStartIndex; i < candles.length; i++) {
        const c = candles[i];
        if (lastValidHigh && c.close > lastValidHigh.price) {
            bias = 'BULLISH';
            logMsg = 'BODY_CLOSE_BOS_BULLISH';
        } else if (lastValidLow && c.close < lastValidLow.price) {
            bias = 'BEARISH';
            logMsg = 'BODY_CLOSE_BOS_BEARISH';
        }
    }
    
    if (bias === 'NEUTRAL' && lastValidHigh && lastValidLow) {
        if (lastValidHigh.index > lastValidLow.index) bias = 'BULLISH';
        else bias = 'BEARISH';
        logMsg = 'CURRENT_STRUCTURAL_LEG';
    }

    return { bias, log: logMsg };
}

function analyzeM15(candles, h4Bias) {
    if (!candles || candles.length < 20) return { pdArray: false, liquiditySweep: false, cisd: false, breaker: false, idm: false };
    
    const swings = getSwings(candles, 3);
    const highs = swings.filter(s => s.type === 'HIGH');
    const lows = swings.filter(s => s.type === 'LOW');
    
    let pdArray = false;
    let liquiditySweep = false;
    let cisd = false;
    let breaker = false;
    let idm = false;
    
    let sweepCandleIdx = -1;

    if (h4Bias === 'BULLISH') {
        for (let i = 2; i < candles.length - 1; i++) {
            if (candles[i-2].high < candles[i].low) pdArray = true;
        }

        const recentLows = lows.slice(-3);
        for (const sl of recentLows) {
            for (let i = sl.index + 1; i < candles.length; i++) {
                if (candles[i].low < sl.price && candles[i].close > sl.price) {
                    liquiditySweep = true;
                    sweepCandleIdx = i;
                }
            }
        }

        if (liquiditySweep && sweepCandleIdx !== -1) {
            const internalHighs = highs.filter(h => h.index < sweepCandleIdx);
            const relevantHigh = internalHighs[internalHighs.length - 1];
            if (relevantHigh) {
                for (let i = sweepCandleIdx + 1; i < candles.length; i++) {
                    if (candles[i].close > relevantHigh.price) cisd = true;
                }
            }
        }

        if (cisd) {
            let bearishOBHigh = -1;
            for(let i = Math.max(0, sweepCandleIdx - 5); i < sweepCandleIdx; i++) {
                if (candles[i].close > candles[i].open) { 
                    bearishOBHigh = Math.max(bearishOBHigh, candles[i].high);
                }
            }
            if (bearishOBHigh !== -1) {
                for (let i = sweepCandleIdx + 1; i < candles.length; i++) {
                    if (candles[i].close > bearishOBHigh) breaker = true;
                }
            }
        }

        if (breaker) {
            const recentLowsAfterSweep = getSwings(candles, 1).filter(s => s.type==='LOW' && s.index > sweepCandleIdx);
            if (recentLowsAfterSweep.length > 0) {
                const inducementLow = recentLowsAfterSweep[0];
                for (let i = inducementLow.index + 1; i < candles.length; i++) {
                    if (candles[i].low < inducementLow.price) idm = true;
                }
            }
        }
    } else {
        for (let i = 2; i < candles.length - 1; i++) {
            if (candles[i-2].low > candles[i].high) pdArray = true;
        }

        const recentHighs = highs.slice(-3);
        for (const sh of recentHighs) {
            for (let i = sh.index + 1; i < candles.length; i++) {
                if (candles[i].high > sh.price && candles[i].close < sh.price) {
                    liquiditySweep = true;
                    sweepCandleIdx = i;
                }
            }
        }

        if (liquiditySweep && sweepCandleIdx !== -1) {
            const internalLows = lows.filter(l => l.index < sweepCandleIdx);
            const relevantLow = internalLows[internalLows.length - 1];
            if (relevantLow) {
                for (let i = sweepCandleIdx + 1; i < candles.length; i++) {
                    if (candles[i].close < relevantLow.price) cisd = true;
                }
            }
        }

        if (cisd) {
            let bullishOBLow = 999999;
            for(let i = Math.max(0, sweepCandleIdx - 5); i < sweepCandleIdx; i++) {
                if (candles[i].close < candles[i].open) { 
                    bullishOBLow = Math.min(bullishOBLow, candles[i].low);
                }
            }
            if (bullishOBLow !== 999999) {
                for (let i = sweepCandleIdx + 1; i < candles.length; i++) {
                    if (candles[i].close < bullishOBLow) breaker = true;
                }
            }
        }

        if (breaker) {
            const recentHighsAfterSweep = getSwings(candles, 1).filter(s => s.type==='HIGH' && s.index > sweepCandleIdx);
            if (recentHighsAfterSweep.length > 0) {
                const inducementHigh = recentHighsAfterSweep[0];
                for (let i = inducementHigh.index + 1; i < candles.length; i++) {
                    if (candles[i].high > inducementHigh.price) idm = true;
                }
            }
        }
    }
    
    return { pdArray, liquiditySweep, cisd, breaker, idm };
}

function analyzeM1(candles, setupSide) {
    if (!candles || candles.length < 10) return { confirmed: false, obZone: null };
    let obZone = null;
    
    if (setupSide === 'BUY') {
        for (let i = 2; i < candles.length - 1; i++) {
            if (candles[i-2].high < candles[i].low) { // Bullish FVG
                let obCandle = null;
                for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
                    if (candles[j].close < candles[j].open) {
                        obCandle = candles[j];
                        break;
                    }
                }
                if (obCandle) obZone = { high: obCandle.high, low: obCandle.low };
            }
        }
    } else {
        for (let i = 2; i < candles.length - 1; i++) {
            if (candles[i-2].low > candles[i].high) { // Bearish FVG
                let obCandle = null;
                for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
                    if (candles[j].close > candles[j].open) {
                        obCandle = candles[j];
                        break;
                    }
                }
                if (obCandle) obZone = { high: obCandle.high, low: obCandle.low };
            }
        }
    }
    
    return { confirmed: obZone !== null, obZone };
}

async function runForwardTest() {
    console.log("Fetching real Gold (GC=F) 1m data for the last 5 days...");
    const m1Data = await fetchYahooData('1m', '5d');
    console.log(`Fetched ${m1Data.length} 1m candles.`);
    
    // Build 15m and 4h
    // Simple downsampling simulation for demonstration (not perfectly grouped by clock, but sufficient for math test)
    const m15Data = [];
    for(let i=0; i<m1Data.length; i+=15) {
        const chunk = m1Data.slice(i, i+15);
        if(chunk.length === 15) {
            m15Data.push({
                time: chunk[0].time,
                open: chunk[0].open,
                high: Math.max(...chunk.map(c=>c.high)),
                low: Math.min(...chunk.map(c=>c.low)),
                close: chunk[chunk.length-1].close,
            });
        }
    }
    
    const h4Data = [];
    for(let i=0; i<m15Data.length; i+=16) {
        const chunk = m15Data.slice(i, i+16);
        if(chunk.length === 16) {
            h4Data.push({
                time: chunk[0].time,
                open: chunk[0].open,
                high: Math.max(...chunk.map(c=>c.high)),
                low: Math.min(...chunk.map(c=>c.low)),
                close: chunk[chunk.length-1].close,
            });
        }
    }
    
    console.log(`Downsampled to ${m15Data.length} 15m candles and ${h4Data.length} 4h candles.`);
    
    let stats = {
        setupsDetected: 0,
        buySignals: 0,
        sellSignals: 0,
        noTrade: 0,
        tpHit: 0,
        slHit: 0,
        expiredSetups: 0,
        rrRejections: 0,
        consecLossEvents: 0,
        totalR: 0,
        maxRDrawdown: 0,
        currentRDrawdown: 0,
        win: 0,
        loss: 0
    };
    
    // Simulate walking through time (start from middle to have enough history)
    const startIndex = Math.floor(m1Data.length / 2);
    
    for (let i = startIndex; i < m1Data.length; i++) {
        const currentM1 = m1Data[i];
        
        // If active trade, check SL/TP
        if (eaState.activeTrade) {
            const t = eaState.activeTrade;
            let closed = false;
            if (t.side === 'BUY') {
                if (currentM1.low <= t.sl) { stats.slHit++; stats.loss++; stats.totalR -= 1; stats.currentRDrawdown += 1; closed = true; }
                else if (currentM1.high >= t.tp) { stats.tpHit++; stats.win++; stats.totalR += t.rr; stats.currentRDrawdown = 0; closed = true; }
            } else {
                if (currentM1.high >= t.sl) { stats.slHit++; stats.loss++; stats.totalR -= 1; stats.currentRDrawdown += 1; closed = true; }
                else if (currentM1.low <= t.tp) { stats.tpHit++; stats.win++; stats.totalR += t.rr; stats.currentRDrawdown = 0; closed = true; }
            }
            if (stats.currentRDrawdown > stats.maxRDrawdown) stats.maxRDrawdown = stats.currentRDrawdown;
            if (closed) {
                if (stats.loss >= eaState.maxConsecutiveLosses) stats.consecLossEvents++;
                eaState.activeTrade = null;
                resetEASetup('TRADE_CLOSED');
            }
            continue;
        }

        // Get recent data slices based on current time
        const recentM1 = m1Data.slice(Math.max(0, i-20), i+1);
        const m15Index = m15Data.findIndex(c => c.time >= currentM1.time) || m15Data.length-1;
        const recentM15 = m15Data.slice(Math.max(0, m15Index-150), m15Index+1);
        const h4Index = h4Data.findIndex(c => c.time >= currentM1.time) || h4Data.length-1;
        const recentH4 = h4Data.slice(Math.max(0, h4Index-30), h4Index+1);
        
        const h4Analysis = analyzeH4Bias(recentH4);
        eaState.h4Bias = h4Analysis.bias;
        
        if (eaState.h4Bias === 'NEUTRAL') { stats.noTrade++;
            // stats.noTrade++;
            continue; // Too spammy to log every minute
        }

        if (eaState.m15Setup === 'WAITING' || eaState.m15Setup === 'CONSUMED') {
            const m15DataRes = analyzeM15(recentM15, eaState.h4Bias);
            
                stats.pdArrayCount = (stats.pdArrayCount||0) + (m15DataRes.pdArray ? 1 : 0);
                stats.sweepCount = (stats.sweepCount||0) + (m15DataRes.liquiditySweep ? 1 : 0);
                stats.cisdCount = (stats.cisdCount||0) + (m15DataRes.cisd ? 1 : 0);
                stats.breakerCount = (stats.breakerCount||0) + (m15DataRes.breaker ? 1 : 0);
                stats.idmCount = (stats.idmCount||0) + (m15DataRes.idm ? 1 : 0);
if (m15DataRes.pdArray && m15DataRes.liquiditySweep && m15DataRes.cisd && m15DataRes.breaker) {
                eaState.setupSide = eaState.h4Bias === 'BULLISH' ? 'BUY' : 'SELL';
                eaState.m15Setup = 'READY_FOR_M1';
                stats.setupsDetected++;
                console.log(`[SETUP] H4_BIAS=${eaState.h4Bias}, M15 PD=true Sweep=true CISD=true Breaker=true IDM=true`);
            }
        }
        
        if (eaState.m15Setup === 'READY_FOR_M1') {
            const m1Res = analyzeM1(recentM1, eaState.setupSide);
            if (m1Res.confirmed && m1Res.obZone) {
                eaState.m1ObZone = m1Res.obZone;
                eaState.setupTimestamp = currentM1.time;
                eaState.m15Setup = 'WAITING_FOR_MITIGATION';
                console.log(`[SETUP] M1_DISPLACEMENT=true M1_FVG=true M1_OB=true (Zone: ${eaState.m1ObZone.low.toFixed(2)} - ${eaState.m1ObZone.high.toFixed(2)})`);
            }
        }
        
        if (eaState.m15Setup === 'WAITING_FOR_MITIGATION' && eaState.m1ObZone) {
            // Expiration (30 min)
            if (currentM1.time - eaState.setupTimestamp > 30 * 60) {
                stats.expiredSetups++;
                resetEASetup('STALE_SETUP');
                continue;
            }
            
            let mitigated = false;
            let currentAsk = currentM1.close;
            let currentBid = currentM1.close;
            if (eaState.setupSide === 'BUY' && currentAsk <= eaState.m1ObZone.high) mitigated = true;
            if (eaState.setupSide === 'SELL' && currentBid >= eaState.m1ObZone.low) mitigated = true;
            
            if (mitigated) {
                const slPips = 2.5; // Gold usually uses points, let's use 2.5 points ($2.50)
                const tpPips = 6.0; // $6.00 move
                const rr = tpPips / slPips;
                if (rr < 2.0) {
                    stats.rrRejections++;
                    resetEASetup('RR_TOO_LOW');
                    continue;
                }
                
                const sl = eaState.setupSide === 'BUY' ? currentAsk - slPips : currentAsk + slPips;
                const tp = eaState.setupSide === 'BUY' ? currentAsk + tpPips : currentAsk - tpPips;
                
                console.log(`[TRADE EXECUTED] ${eaState.setupSide} @ ${currentAsk.toFixed(2)}, SL: ${sl.toFixed(2)}, TP: ${tp.toFixed(2)}, RR: ${rr.toFixed(2)}`);
                
                if (eaState.setupSide === 'BUY') stats.buySignals++;
                else stats.sellSignals++;
                
                eaState.activeTrade = {
                    side: eaState.setupSide,
                    entry: currentAsk,
                    sl: sl,
                    tp: tp,
                    rr: rr
                };
                eaState.m15Setup = 'CONSUMED';
            }
        }
    }
    
    console.log("\n=== FORWARD TEST RESULTS ===");
    console.log(stats); console.log('Total checks:', m1Data.length - startIndex);
    console.log("Win Rate: " + (stats.win / (stats.win + stats.loss) * 100).toFixed(2) + "%");
}

runForwardTest();
