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
