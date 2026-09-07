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
