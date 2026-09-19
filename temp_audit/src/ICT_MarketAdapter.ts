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
