const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCheck = `    // Parallel candle fetching across H4, M15, M1 for lowest latency
    const [h4Candles, m15Candles, m1Candles] = await Promise.all([
      fetchRealCandles(baseUrl, accountId, token, symbolToTrade, '4h', 30),
      fetchRealCandles(baseUrl, accountId, token, symbolToTrade, '15m', 100),
      fetchRealCandles(baseUrl, accountId, token, symbolToTrade, '1m', 100)
    ]);`;

const newCheck = `    // Sequential candle fetching across H4, M15, M1 to avoid 429 rate limit errors
    const h4Candles = await fetchRealCandles(baseUrl, accountId, token, symbolToTrade, '4h', 30);
    await new Promise(r => setTimeout(r, 1000));
    const m15Candles = await fetchRealCandles(baseUrl, accountId, token, symbolToTrade, '15m', 100);
    await new Promise(r => setTimeout(r, 1000));
    const m1Candles = await fetchRealCandles(baseUrl, accountId, token, symbolToTrade, '1m', 100);`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('server.ts', code);
