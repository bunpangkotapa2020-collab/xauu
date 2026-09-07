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
