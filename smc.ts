export interface Candle {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface SwingPoint {
    type: 'HIGH' | 'LOW';
    index: number;
    price: number;
    time: string;
}

export function getSwings(candles: Candle[], left: number = 3, right: number = 3): SwingPoint[] {
    const swings: SwingPoint[] = [];
    for (let i = left; i < candles.length - right; i++) {
        let isHigh = true;
        let isLow = true;
        for (let j = 1; j <= left; j++) {
            if (candles[i-j].high >= candles[i].high) isHigh = false;
            if (candles[i-j].low <= candles[i].low) isLow = false;
        }
        for (let j = 1; j <= right; j++) {
            if (candles[i+j].high > candles[i].high) isHigh = false;
            if (candles[i+j].low < candles[i].low) isLow = false;
        }
        if (isHigh) swings.push({ type: 'HIGH', index: i, price: candles[i].high, time: candles[i].time });
        if (isLow) swings.push({ type: 'LOW', index: i, price: candles[i].low, time: candles[i].time });
    }
    return swings;
}

export function analyzeH4Bias(candles: Candle[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    if (!candles || candles.length < 20) return 'NEUTRAL';
    const swings = getSwings(candles, 2, 2);
    if (swings.length < 4) return 'NEUTRAL';
    
    const recent = swings.slice(-4);
    let hhCount = 0, hlCount = 0, lhCount = 0, llCount = 0;
    
    let lastHigh = -1, lastLow = -1;
    for (const s of recent) {
        if (s.type === 'HIGH') {
            if (lastHigh !== -1) {
                if (s.price > lastHigh) hhCount++;
                else lhCount++;
            }
            lastHigh = s.price;
        } else {
            if (lastLow !== -1) {
                if (s.price > lastLow) hlCount++;
                else llCount++;
            }
            lastLow = s.price;
        }
    }
    
    const lastSwing = swings[swings.length - 1];
    const prevOppositeSwing = swings.slice().reverse().find(s => s.type !== lastSwing.type);
    const currentPrice = candles[candles.length - 1].close;

    if (hhCount > 0 && hlCount >= 0) return 'BULLISH';
    if (llCount > 0 && lhCount >= 0) return 'BEARISH';
    
    if (prevOppositeSwing) {
        if (lastSwing.type === 'LOW' && currentPrice > prevOppositeSwing.price) return 'BULLISH'; // MSS bullish
        if (lastSwing.type === 'HIGH' && currentPrice < prevOppositeSwing.price) return 'BEARISH'; // MSS bearish
    }
    
    return 'NEUTRAL';
}

export function analyzeM15(candles: Candle[], h4Bias: 'BULLISH' | 'BEARISH'): any {
    if (!candles || candles.length < 20) return { pdArray: false, liquiditySweep: false, cisd: false, breaker: false, idm: false };
    
    const swings = getSwings(candles, 3, 3);
    const lastCandle = candles[candles.length - 1];
    const prevCandles = candles.slice(-8); // Last 8 candles for sweep detection
    
    let pdArray = false;
    let liquiditySweep = false;
    let cisd = false;
    let breaker = false;
    let idm = false;
    
    if (swings.length >= 3) pdArray = true; // We have established structure to form arrays

    if (h4Bias === 'BULLISH') {
        const recentLows = swings.filter(s => s.type === 'LOW').slice(-3);
        // Liquidity Sweep (Stop Hunt)
        for (const sl of recentLows) {
            for (const c of prevCandles) {
                if (c.low < sl.price && c.close > sl.price) {
                    liquiditySweep = true;
                }
            }
        }
        // CISD
        if (liquiditySweep && lastCandle.close > candles[candles.length - 2].high) {
            cisd = true;
        }
        // Breaker: Look for a previous up-swing (failed bearish OB) that price broke above
        const recentHighs = swings.filter(s => s.type === 'HIGH');
        for (const sh of recentHighs) {
            if (lastCandle.close > sh.price) breaker = true; 
        }
        // IDM: Pullback detection (a minor high broken before sweeping a major low)
        for (let i = candles.length - 5; i < candles.length - 1; i++) {
             if (candles[i].high < candles[i-1].high && candles[i+1].close > candles[i].high) {
                 idm = true;
             }
        }
    } else if (h4Bias === 'BEARISH') {
        const recentHighs = swings.filter(s => s.type === 'HIGH').slice(-3);
        for (const sh of recentHighs) {
            for (const c of prevCandles) {
                if (c.high > sh.price && c.close < sh.price) {
                    liquiditySweep = true;
                }
            }
        }
        if (liquiditySweep && lastCandle.close < candles[candles.length - 2].low) {
            cisd = true;
        }
        const recentLows = swings.filter(s => s.type === 'LOW');
        for (const sl of recentLows) {
            if (lastCandle.close < sl.price) breaker = true; 
        }
        for (let i = candles.length - 5; i < candles.length - 1; i++) {
             if (candles[i].low > candles[i-1].low && candles[i+1].close < candles[i].low) {
                 idm = true;
             }
        }
    }
    
    return { pdArray, liquiditySweep, cisd, breaker, idm };
}

export function analyzeM1(candles: Candle[], h4Bias: 'BULLISH' | 'BEARISH'): boolean {
    if (!candles || candles.length < 10) return false;
    let obDetected = false;
    const lastCandles = candles.slice(-10);
    
    if (h4Bias === 'BULLISH') {
        for (let i = 0; i < lastCandles.length - 2; i++) {
            if (lastCandles[i].close < lastCandles[i].open) { 
                const move = lastCandles[i+2].close - lastCandles[i+1].open;
                if (move > 0.5) obDetected = true; // Minimum displacement to confirm OB
            }
        }
    } else {
        for (let i = 0; i < lastCandles.length - 2; i++) {
            if (lastCandles[i].close > lastCandles[i].open) { 
                const move = lastCandles[i+1].open - lastCandles[i+2].close;
                if (move > 0.5) obDetected = true; 
            }
        }
    }
    return obDetected;
}
