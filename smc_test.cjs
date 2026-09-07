const fs = require('fs');

function getSwings(candles, n=3) {
    let swings = [];
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

function analyzeH4BiasStrict(candles) {
    if (candles.length < 20) return 'NEUTRAL';
    const swings = getSwings(candles, 3);
    if (swings.length < 4) return 'NEUTRAL';
    
    // We look for strict body close BOS
    let bias = 'NEUTRAL';
    
    // Find the last major high and low
    const highs = swings.filter(s => s.type === 'HIGH');
    const lows = swings.filter(s => s.type === 'LOW');
    if (highs.length < 2 || lows.length < 2) return 'NEUTRAL';
    
    const lastHigh = highs[highs.length - 1];
    const lastLow = lows[lows.length - 1];
    
    // Check body closes after the last swing
    for (let i = Math.max(lastHigh.index, lastLow.index) + 1; i < candles.length; i++) {
        const c = candles[i];
        if (c.close > lastHigh.price) bias = 'BULLISH'; // Body Close BOS/MSS Bullish
        if (c.close < lastLow.price) bias = 'BEARISH'; // Body Close BOS/MSS Bearish
    }
    
    return bias;
}

// Simulated tests
const bullishBOSCandles = Array.from({length: 30}, (_, i) => ({
    time: i, open: 100+i, high: 105+i, low: 95+i, close: 102+i
}));
bullishBOSCandles[15] = { time: 15, open: 120, high: 150, low: 110, close: 125 }; // Swing High
bullishBOSCandles[29] = { time: 29, open: 140, high: 160, low: 130, close: 155 }; // Body Close > 150

console.log("TEST Bullish Body Close BOS:", analyzeH4BiasStrict(bullishBOSCandles));

