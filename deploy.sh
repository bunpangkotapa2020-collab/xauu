mkdir -p src

cat << 'INNER_EOF' > src/ICT_MT5_Integration.ts
import { ICTMarketData, Candle } from './ICT_MarketAdapter';
import { EAPosition } from './MASTER_ICT_EA';

/**
 * INTEGRATION ARCHITECTURE (NO-TOUCH SERVER.TS DESIGN)
 * 
 * This file defines exactly how the ICT EA will be integrated with the live
 * MT5 server once approved, without requiring invasive changes to the existing logic.
 */

// 1. Data Feed Interface
// The existing MetaApi listener in server.ts will simply implement this interface
// and pass standard normalized objects into the EA.
export interface IMT5DataReceiver {
    onTick(data: ICTMarketData): Promise<void>;
}

// 2. Order Execution Interface
// The EA uses this interface to request orders. During simulation, we use a Mock.
// In production, this maps exactly to connection.createMarketBuyOrder / SellOrder.
export interface IMT5ExecutionAdapter {
    executeBuy(symbol: string, lot: number, sl: number, tp: number, magic: number, signalEntry?: number): Promise<string>;
    executeSell(symbol: string, lot: number, sl: number, tp: number, magic: number, signalEntry?: number): Promise<string>;
    getOpenPositions(magic: number): Promise<EAPosition[]>;
    getAccountBalance(): Promise<number>;
}

// 3. Mock Implementation for Safe Pre-Integration Testing
export class MockMT5Execution implements IMT5ExecutionAdapter {
    private positions: EAPosition[] = [];
    
    public async executeBuy(symbol: string, lot: number, sl: number, tp: number, magic: number, signalEntry?: number): Promise<string> {
        const ticket = "MT5_MOCK_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        this.positions.push({ ticket, symbol, type: 'BUY', lot, openPrice: signalEntry || 0, sl, tp, magic, setupId: "mock_id" });
        return ticket;
    }
    
    public async executeSell(symbol: string, lot: number, sl: number, tp: number, magic: number, signalEntry?: number): Promise<string> {
        const ticket = "MT5_MOCK_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        this.positions.push({ ticket, symbol, type: 'SELL', lot, openPrice: signalEntry || 0, sl, tp, magic, setupId: "mock_id" });
        return ticket;
    }
    
    public async getOpenPositions(magic: number): Promise<EAPosition[]> {
        return this.positions.filter(p => p.magic === magic);
    }
    
    public async getAccountBalance(): Promise<number> {
        return 10000.00;
    }
}
INNER_EOF

cat << 'INNER_EOF' > src/ICT_MarketAdapter.ts
export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ICTMarketData {
    symbol: string;
    ask: number;
    bid: number;
    spread: number;
    serverTime: number;
    h4Candles: Candle[];
    m15Candles: Candle[];
    m1Candles: Candle[];
    volatilityIsHigh: boolean;
    isNewsTime: boolean;
    mt5MinLot: number;
    mt5MaxLot: number;
    mt5LotStep: number;
}

export class ICTMarketAdapter {
    public validateData(data: ICTMarketData): { isValid: boolean; reason?: string } {
        if (!data.symbol || data.symbol !== 'XAUUSD') return { isValid: false, reason: "Symbol not XAUUSD" };
        if (data.ask <= 0 || data.bid <= 0) return { isValid: false, reason: "Invalid Bid/Ask" };
        if (!data.h4Candles || data.h4Candles.length < 3) return { isValid: false, reason: "Missing H4 candles" };
        if (!data.m15Candles || data.m15Candles.length < 3) return { isValid: false, reason: "Missing M15 candles" };
        if (!data.m1Candles || data.m1Candles.length < 3) return { isValid: false, reason: "Missing M1 candles" };
        
        // Stale data protection (reject if serverTime is more than 5 minutes off for testing, usually 1 min)
        if (Math.abs(Date.now() - data.serverTime) > 300000) {
             return { isValid: false, reason: "Stale Market Data" };
        }
        
        return { isValid: true };
    }
}
INNER_EOF

cat << 'INNER_EOF' > src/ICT_NewsAdapter.ts
export interface NewsEvent {
    time: number;
    currency: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    title?: string;
}

export interface INewsProvider {
    /**
     * Returns a list of upcoming high-impact news events.
     * Returns null if data is unavailable or API fails.
     */
    getUpcomingHighImpactEvents(currentTime: number): Promise<NewsEvent[] | null>;
    getStatus(): 'CONNECTED' | 'UNAVAILABLE';
}

export class ICTNewsAdapter {
    private provider: INewsProvider;

    constructor(provider: INewsProvider) {
        this.provider = provider;
    }

    public async isNewsBlockActive(
        currentTime: number,
        minsBefore: number,
        minsAfter: number
    ): Promise<{ isBlocked: boolean; reason?: string }> {
        const events = await this.provider.getUpcomingHighImpactEvents(currentTime);
        
        if (events === null) {
            return { isBlocked: true, reason: 'NEWS DATA UNAVAILABLE' };
        }

        for (const event of events) {
            if (event.impact === 'HIGH') {
                const msBefore = minsBefore * 60 * 1000;
                const msAfter = minsAfter * 60 * 1000;
                
                const blockStart = event.time - msBefore;
                const blockEnd = event.time + msAfter;

                if (currentTime >= blockStart && currentTime <= blockEnd) {
                    return { 
                        isBlocked: true, 
                        reason: `NEWS BLOCK ACTIVE | HIGH IMPACT USD EVENT | EVENT: ${event.title || 'Unknown Event'} | TIME: ${new Date(event.time).toISOString()} | NEW ENTRY BLOCKED`
                    };
                }
            }
        }

        return { isBlocked: false };
    }
}

export class RealNewsProvider implements INewsProvider {
    private cache: NewsEvent[] | null = null;
    private lastFetchTime: number = 0;
    private lastErrorTime: number = 0;
    private readonly CACHE_TTL = 3600 * 1000; // 1 hour (FairEconomy updates once per hour)
    private readonly ERROR_BACKOFF_TTL = 300 * 1000; // 5 minutes backoff on 429/error
    private inFlightPromise: Promise<NewsEvent[] | null> | null = null;

    constructor() {
        // Pre-warm news cache immediately on startup
        this.getUpcomingHighImpactEvents(Date.now()).catch(() => {});
    }

    public async getUpcomingHighImpactEvents(currentTime: number): Promise<NewsEvent[] | null> {
        // Return existing valid cache if within TTL
        if (this.cache !== null && (currentTime - this.lastFetchTime) < this.CACHE_TTL) {
            return this.cache;
        }

        // Return current cache if in error backoff period (prevents hammering API on 429)
        if (this.lastErrorTime > 0 && (currentTime - this.lastErrorTime) < this.ERROR_BACKOFF_TTL) {
            return this.cache;
        }

        // Return in-flight fetch promise if already fetching
        if (this.inFlightPromise !== null) {
            return this.inFlightPromise;
        }

        this.inFlightPromise = this.fetchNews(currentTime);
        try {
            const result = await this.inFlightPromise;
            return result;
        } finally {
            this.inFlightPromise = null;
        }
    }

    private async fetchNews(currentTime: number): Promise<NewsEvent[] | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                }
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                this.lastErrorTime = currentTime;
                if (response.status === 429) {
                    console.warn(`[NEWS API] Rate limited (HTTP 429). Retrying in 5 minutes after server cooldown.`);
                } else {
                    console.error(`[NEWS API] HTTP error! status: ${response.status}`);
                }
                return this.cache;
            }

            const data = await response.json();
            const events: NewsEvent[] = [];

            if (Array.isArray(data)) {
                for (const item of data) {
                    // We only care about USD for XAUUSD trading, and HIGH impact
                    if (item.country === 'USD' && item.impact === 'High') {
                        const eventTime = new Date(item.date).getTime();
                        if (!isNaN(eventTime)) {
                            events.push({
                                time: eventTime,
                                currency: item.country,
                                impact: 'HIGH',
                                title: item.title
                            });
                        }
                    }
                }
            }

            this.cache = events;
            this.lastFetchTime = currentTime;
            this.lastErrorTime = 0;

            return this.cache;
        } catch (error: any) {
            this.lastErrorTime = currentTime;
            console.warn(`[NEWS API] Fetch paused: ${error?.message || error}. Will retry in 5 minutes.`);
            return this.cache;
        }
    }

    public getStatus(): 'CONNECTED' | 'UNAVAILABLE' {
        if (this.cache !== null) return 'CONNECTED';
        if (this.lastErrorTime > 0 && Date.now() - this.lastErrorTime < this.ERROR_BACKOFF_TTL) {
            return 'UNAVAILABLE';
        }
        return 'CONNECTED';
    }
}

// Mock provider for testing purposes
export class MockNewsProvider implements INewsProvider {
    public mockEvents: NewsEvent[] | null = [];
    
    public async getUpcomingHighImpactEvents(currentTime: number): Promise<NewsEvent[] | null> {
        return this.mockEvents;
    }

    public getStatus(): 'CONNECTED' | 'UNAVAILABLE' {
        return this.mockEvents !== null ? 'CONNECTED' : 'UNAVAILABLE';
    }
}
INNER_EOF

cat << 'INNER_EOF' > src/ICT_RealMarketAdapter.ts
import { ICTMarketData, Candle } from './ICT_MarketAdapter.js';
import { IctXauusdEA } from './MASTER_ICT_EA.js';

export class ICTRealMarketAdapter {
    private ea: IctXauusdEA | null = null;
    private symbol: string = 'XAUUSDc';

    constructor(ea: IctXauusdEA) {
        this.ea = ea;
    }

    public setSymbol(symbol: string) {
        this.symbol = symbol;
    }

    /**
     * Normalizes raw data from MetaApi into the standard ICTMarketData interface.
     * This module does NOT execute any trades. It strictly acts as a data pipeline 
     * from the existing MT5 connection to the new isolated EA.
     */
    public async processMarketData(
        currentAsk: number,
        currentBid: number,
        h4Raw: any[],
        m15Raw: any[],
        m1Raw: any[],
        serverTimeMs: number,
        symbolOverride?: string
    ): Promise<void> {
        
        if (!this.ea) return;

        const h4Candles = this.mapCandles(h4Raw);
        const m15Candles = this.mapCandles(m15Raw);
        const m1Candles = this.mapCandles(m1Raw);

        const activeSymbol = symbolOverride || this.symbol;

        const marketData: ICTMarketData = {
            symbol: activeSymbol,
            ask: currentAsk,
            bid: currentBid,
            spread: (currentAsk - currentBid) * 100, // Points
            serverTime: serverTimeMs,
            h4Candles: h4Candles,
            m15Candles: m15Candles,
            m1Candles: m1Candles,
            volatilityIsHigh: false, // Could be mapped from server's calculation if passed
            isNewsTime: false,
            mt5MinLot: 0.01,
            mt5MaxLot: 100,
            mt5LotStep: 0.01
        };

        // Feed to EA
        await this.ea.onTick(marketData);
    }

    private mapCandles(raw: any[]): Candle[] {
        if (!raw) return [];
        return raw.map((d: any) => ({
            time: new Date(d.time).getTime(),
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.tickVolume || d.volume || 0
        }));
    }
}
INNER_EOF

pm2 start "npx tsx server.ts" --name smc-bot
pm2 save
pm2 logs smc-bot
