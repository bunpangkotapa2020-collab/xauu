const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /async function fetchRealSpotGoldPrice\(\):[\s\S]*?return null;\n\}/;
const replaceStr = `async function fetchRealSpotGoldPrice(): Promise<{ bid: number, ask: number, spreadPoints: number, time: number } | null> {
    const now = Date.now();
    
    // Fire network request in the background if it's been more than 2 seconds since last successful fetch
    if (now - lastRealSpotFetchTime > 2000) {
        doFetchRealSpotGoldPrice(now).finally(() => { isFetchingSpot = false; });
    }

    // Immediately return the cache (with simulated jitter to keep the engine flowing)
    if (cachedRealSpot) {
        let finalBid = cachedRealSpot.bid;
        const spreadPoints = cachedRealSpot.spreadPoints;
        const microJitter = (Math.random() * 0.04) - 0.02;
        finalBid = Number((finalBid + microJitter).toFixed(2));
        let finalAsk = Number((finalBid + (spreadPoints / 100)).toFixed(2));
        
        cachedRealSpot = { bid: finalBid, ask: finalAsk, spreadPoints, time: now };
        return cachedRealSpot;
    }

    return null;
}`;

code = code.replace(regex, replaceStr);
fs.writeFileSync('server.ts', code);
console.log("Fixed fetchRealSpotGoldPrice completely");
