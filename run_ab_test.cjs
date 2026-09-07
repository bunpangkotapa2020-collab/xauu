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
    if (!candles || candles.length < 20) return { bias: 'NEUTRAL' };
    const swings = getSwings(candles, 3);
    if (swings.length < 2) return { bias: 'NEUTRAL' };
    
    let lastValidHigh = null;
    let lastValidLow = null;
    for (let i = swings.length - 1; i >= 0; i--) {
        if (!lastValidHigh && swings[i].type === 'HIGH') lastValidHigh = swings[i];
        if (!lastValidLow && swings[i].type === 'LOW') lastValidLow = swings[i];
        if (lastValidHigh && lastValidLow) break;
    }
    
    let bias = 'NEUTRAL';
    const checkStartIndex = Math.max(lastValidHigh?.index || 0, lastValidLow?.index || 0) + 1;
    for (let i = checkStartIndex; i < candles.length; i++) {
        const c = candles[i];
        if (lastValidHigh && c.close > lastValidHigh.price) bias = 'BULLISH';
        else if (lastValidLow && c.close < lastValidLow.price) bias = 'BEARISH';
    }
    if (bias === 'NEUTRAL' && lastValidHigh && lastValidLow) {
        if (lastValidHigh.index > lastValidLow.index) bias = 'BULLISH';
        else bias = 'BEARISH';
    }
    return { bias };
}

function analyzeM15(candles, h4Bias) {
    if (!candles || candles.length < 20) return { pdArray: false, liquiditySweep: false, cisd: false, breaker: false, idm: false };
    const swings = getSwings(candles, 3);
    const highs = swings.filter(s => s.type === 'HIGH');
    const lows = swings.filter(s => s.type === 'LOW');
    
    let pdArray = false, liquiditySweep = false, cisd = false, breaker = false, idm = false, sweepCandleIdx = -1;

    if (h4Bias === 'BULLISH') {
        for (let i = 2; i < candles.length - 1; i++) if (candles[i-2].high < candles[i].low) pdArray = true;
        for (const sl of lows.slice(-3)) {
            for (let i = sl.index + 1; i < candles.length; i++) {
                if (candles[i].low < sl.price && candles[i].close > sl.price) { liquiditySweep = true; sweepCandleIdx = i; }
            }
        }
        if (liquiditySweep && sweepCandleIdx !== -1) {
            const ih = highs.filter(h => h.index < sweepCandleIdx);
            if (ih.length > 0) {
                for (let i = sweepCandleIdx + 1; i < candles.length; i++) if (candles[i].close > ih[ih.length-1].price) cisd = true;
            }
        }
        if (cisd) {
            let bobh = -1;
            for(let i = Math.max(0, sweepCandleIdx - 5); i < sweepCandleIdx; i++) if (candles[i].close > candles[i].open) bobh = Math.max(bobh, candles[i].high);
            if (bobh !== -1) {
                for (let i = sweepCandleIdx + 1; i < candles.length; i++) if (candles[i].close > bobh) breaker = true;
            }
        }
        if (breaker) {
            const rh = getSwings(candles, 1).filter(s => s.type==='LOW' && s.index > sweepCandleIdx);
            if (rh.length > 0) {
                for (let i = rh[0].index + 1; i < candles.length; i++) if (candles[i].low < rh[0].price) idm = true;
            }
        }
    } else {
        for (let i = 2; i < candles.length - 1; i++) if (candles[i-2].low > candles[i].high) pdArray = true;
        for (const sh of highs.slice(-3)) {
            for (let i = sh.index + 1; i < candles.length; i++) {
                if (candles[i].high > sh.price && candles[i].close < sh.price) { liquiditySweep = true; sweepCandleIdx = i; }
            }
        }
        if (liquiditySweep && sweepCandleIdx !== -1) {
            const il = lows.filter(l => l.index < sweepCandleIdx);
            if (il.length > 0) {
                for (let i = sweepCandleIdx + 1; i < candles.length; i++) if (candles[i].close < il[il.length-1].price) cisd = true;
            }
        }
        if (cisd) {
            let bobl = 999999;
            for(let i = Math.max(0, sweepCandleIdx - 5); i < sweepCandleIdx; i++) if (candles[i].close < candles[i].open) bobl = Math.min(bobl, candles[i].low);
            if (bobl !== 999999) {
                for (let i = sweepCandleIdx + 1; i < candles.length; i++) if (candles[i].close < bobl) breaker = true;
            }
        }
        if (breaker) {
            const rh = getSwings(candles, 1).filter(s => s.type==='HIGH' && s.index > sweepCandleIdx);
            if (rh.length > 0) {
                for (let i = rh[0].index + 1; i < candles.length; i++) if (candles[i].high > rh[0].price) idm = true;
            }
        }
    }
    return { pdArray, liquiditySweep, cisd, breaker, idm };
}

function analyzeM1(candles, setupSide) {
    if (!candles || candles.length < 10) return { confirmed: false, obZone: null };
    let obZone = null;
    
    for (let i = 2; i < candles.length - 1; i++) {
        if (setupSide === 'BUY' && candles[i-2].high < candles[i].low) {
            for (let j = i - 1; j >= Math.max(0, i - 5); j--) if (candles[j].close < candles[j].open) obZone = { high: candles[j].high, low: candles[j].low };
        } else if (setupSide === 'SELL' && candles[i-2].low > candles[i].high) {
            for (let j = i - 1; j >= Math.max(0, i - 5); j--) if (candles[j].close > candles[j].open) obZone = { high: candles[j].high, low: candles[j].low };
        }
    }
    return { confirmed: obZone !== null, obZone };
}

async function runBacktest(m1Data, m15Data, h4Data, strictIDM) {
    let state = { m15Setup: 'WAITING', setupSide: 'NONE', setupTimestamp: 0, m1ObZone: null, activeTrade: null, h4Bias: 'NEUTRAL' };
    
    let stats = {
        setupsDetected: 0, buySetups: 0, sellSetups: 0,
        trades: 0, tpHit: 0, slHit: 0,
        totalR: 0, maxRDrawdown: 0, currentRDrawdown: 0,
        consecLossEvents: 0, lossStreak: 0,
        expiredSetups: 0, missedDueToIDM: 0, idmPresent: 0, idmAbsent: 0
    };
    
    const startIndex = Math.floor(m1Data.length / 2);
    
    for (let i = startIndex; i < m1Data.length; i++) {
        const currentM1 = m1Data[i];
        
        if (state.activeTrade) {
            const t = state.activeTrade;
            let closed = false;
            if (t.side === 'BUY') {
                if (currentM1.low <= t.sl) { stats.slHit++; stats.lossStreak++; stats.totalR -= 1; stats.currentRDrawdown += 1; closed = true; }
                else if (currentM1.high >= t.tp) { stats.tpHit++; stats.lossStreak=0; stats.totalR += t.rr; stats.currentRDrawdown = 0; closed = true; }
            } else {
                if (currentM1.high >= t.sl) { stats.slHit++; stats.lossStreak++; stats.totalR -= 1; stats.currentRDrawdown += 1; closed = true; }
                else if (currentM1.low <= t.tp) { stats.tpHit++; stats.lossStreak=0; stats.totalR += t.rr; stats.currentRDrawdown = 0; closed = true; }
            }
            if (stats.currentRDrawdown > stats.maxRDrawdown) stats.maxRDrawdown = stats.currentRDrawdown;
            if (closed) {
                if (stats.lossStreak >= 3) { stats.consecLossEvents++; stats.lossStreak = 0; }
                state.activeTrade = null;
                state.m15Setup = 'WAITING';
            }
            continue;
        }

        const m15Index = m15Data.findIndex(c => c.time >= currentM1.time) || m15Data.length-1;
        const h4Index = h4Data.findIndex(c => c.time >= currentM1.time) || h4Data.length-1;
        const h4Bias = analyzeH4Bias(h4Data.slice(Math.max(0, h4Index-30), h4Index+1)).bias;
        
        if (h4Bias === 'NEUTRAL') continue;

        if (state.m15Setup === 'WAITING' || state.m15Setup === 'CONSUMED') {
            const m15Res = analyzeM15(m15Data.slice(Math.max(0, m15Index-150), m15Index+1), h4Bias);
            const coreValid = m15Res.pdArray && m15Res.liquiditySweep && m15Res.cisd && m15Res.breaker;
            
            if (coreValid) {
                if (m15Res.idm) stats.idmPresent++;
                else stats.idmAbsent++;
                
                if (strictIDM && !m15Res.idm) {
                    stats.missedDueToIDM++;
                } else if (coreValid && (!strictIDM || m15Res.idm)) {
                    state.setupSide = h4Bias === 'BULLISH' ? 'BUY' : 'SELL';
                    state.m15Setup = 'READY_FOR_M1';
                    stats.setupsDetected++;
                    if (state.setupSide === 'BUY') stats.buySetups++; else stats.sellSetups++;
                }
            }
        }
        
        if (state.m15Setup === 'READY_FOR_M1') {
            const m1Res = analyzeM1(m1Data.slice(Math.max(0, i-20), i+1), state.setupSide);
            if (m1Res.confirmed && m1Res.obZone) {
                state.m1ObZone = m1Res.obZone;
                state.setupTimestamp = currentM1.time;
                state.m15Setup = 'WAITING_FOR_MITIGATION';
            }
        }
        
        if (state.m15Setup === 'WAITING_FOR_MITIGATION' && state.m1ObZone) {
            if (currentM1.time - state.setupTimestamp > 30 * 60) {
                stats.expiredSetups++;
                state.m15Setup = 'WAITING';
                continue;
            }
            
            let mitigated = false;
            if (state.setupSide === 'BUY' && currentM1.close <= state.m1ObZone.high) mitigated = true;
            if (state.setupSide === 'SELL' && currentM1.close >= state.m1ObZone.low) mitigated = true;
            
            if (mitigated) {
                const slPips = 2.5; const tpPips = 6.0; const rr = 2.4;
                state.activeTrade = {
                    side: state.setupSide,
                    entry: currentM1.close,
                    sl: state.setupSide === 'BUY' ? currentM1.close - slPips : currentM1.close + slPips,
                    tp: state.setupSide === 'BUY' ? currentM1.close + tpPips : currentM1.close - tpPips,
                    rr: rr
                };
                stats.trades++;
                state.m15Setup = 'CONSUMED';
            }
        }
    }
    
    stats.winRate = stats.trades > 0 ? (stats.tpHit / stats.trades * 100).toFixed(2) + '%' : '0%';
    stats.avgRR = 2.4;
    return stats;
}

async function run() {
    console.log("Fetching Gold (GC=F) 1m data for 7d (Max available 1m limit)...");
    const m1Data = await fetchYahooData('1m', '7d');
    
    const m15Data = [], h4Data = [];
    for(let i=0; i<m1Data.length; i+=15) {
        const chunk = m1Data.slice(i, i+15);
        if(chunk.length === 15) m15Data.push({ time: chunk[0].time, open: chunk[0].open, high: Math.max(...chunk.map(c=>c.high)), low: Math.min(...chunk.map(c=>c.low)), close: chunk[chunk.length-1].close });
    }
    for(let i=0; i<m15Data.length; i+=16) {
        const chunk = m15Data.slice(i, i+16);
        if(chunk.length === 16) h4Data.push({ time: chunk[0].time, open: chunk[0].open, high: Math.max(...chunk.map(c=>c.high)), low: Math.min(...chunk.map(c=>c.low)), close: chunk[chunk.length-1].close });
    }
    
    console.log("=== MODEL A: IDM STRICT ===");
    const statsA = await runBacktest(m1Data, m15Data, h4Data, true);
    console.log(statsA);
    
    console.log("=== MODEL B: IDM OPTIONAL ===");
    const statsB = await runBacktest(m1Data, m15Data, h4Data, false);
    console.log(statsB);
}

run();
