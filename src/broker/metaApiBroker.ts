import { Action, Trade } from '../types';

export interface BrokerInterface {
  executeOrder(symbol: string, action: Action, lotSize: number, sl: number, tp: number): Promise<{
    success: boolean;
    ticket?: string;
    fillPrice?: number;
    error?: string;
  }>;
  modifyPositionProtection(positionId: string, stopLoss: number, takeProfit: number): Promise<{
    success: boolean;
    error?: string;
  }>;
  getOpenPositions(): Promise<Trade[]>;
  closePosition(ticket: string): Promise<boolean>;
  closeAllPositions(): Promise<{ success: boolean; closedCount: number; errors?: string[] }>;
  testConnection(): Promise<{ success: boolean; message: string }>;
}

export class PaperBroker implements BrokerInterface {
  private trades: Trade[] = [];

  async executeOrder(symbol: string, action: Action, lotSize: number, sl: number, tp: number) {
    const ticket = `PAPER_${Math.floor(Math.random() * 1000000)}`;
    const fillPrice = 2650.00; // Simulated fill price
    
    const trade: Trade = {
      ticket,
      symbol,
      action,
      lotSize,
      openPrice: fillPrice,
      sl,
      tp,
      openTime: new Date().toISOString(),
      profit: 0
    };

    this.trades.push(trade);
    console.log(`[PAPER BROKER] Executed ${action} ${symbol} at ${fillPrice}`);
    
    return {
      success: true,
      ticket,
      fillPrice
    };
  }

  async modifyPositionProtection(positionId: string, stopLoss: number, takeProfit: number): Promise<{ success: boolean; error?: string }> {
    const trade = this.trades.find(t => t.ticket === positionId);
    if (!trade) {
      return { success: false, error: `Position ${positionId} not found in PaperBroker` };
    }
    trade.sl = stopLoss;
    trade.tp = takeProfit;
    console.log(`[PAPER BROKER] Realigned SL/TP for ${positionId} -> SL: ${stopLoss}, TP: ${takeProfit}`);
    return { success: true };
  }

  async getOpenPositions(): Promise<Trade[]> {
    return this.trades;
  }

  async closePosition(ticket: string): Promise<boolean> {
    this.trades = this.trades.filter(t => t.ticket !== ticket);
    return true;
  }

  async closeAllPositions(): Promise<{ success: boolean; closedCount: number }> {
    const count = this.trades.length;
    this.trades = [];
    return { success: true, closedCount: count };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Paper Broker is always online' };
  }
}

// In a real implementation, this would connect to MetaAPI
// @ts-ignore
import MetaApi from 'metaapi.cloud-sdk/esm-node';

export class MetaApiBroker implements BrokerInterface {
  private api: any;
  private accountId: string;
  private token: string;
  private region: string;
  private connection: any = null;
  private account: any = null;

  constructor(accountId: string, token: string, region: string = 'new-york') {
    this.accountId = accountId;
    this.token = token;
    this.region = region;
    
    if (token) {
      // @ts-ignore
      this.api = new MetaApi(token);
    }
  }

  async connect() {
    if (!this.token || !this.accountId) throw new Error('MetaAPI Credentials missing');
    
    try {
      this.account = await this.api.metatraderAccountApi.getAccount(this.accountId);
      
      if (this.account.state !== 'DEPLOYED') {
        console.log('[METAAPI] Account not deployed. Deploying...');
        await this.account.deploy();
      }
      
      await this.account.waitConnected();
      this.connection = await this.account.getRPCConnection();
      return true;
    } catch (err: any) {
      console.error('[METAAPI] Connection failed:', err.message);
      throw err;
    }
  }

  async executeOrder(symbol: string, action: Action, lotSize: number, sl: number, tp: number) {
    try {
      if (!this.connection) await this.connect();
      
      const order = action === 'BUY'
        ? await this.connection.createMarketBuyOrder(symbol, lotSize, sl, tp, {
            comment: 'DaRa M1 Signal'
          })
        : await this.connection.createMarketSellOrder(symbol, lotSize, sl, tp, {
            comment: 'DaRa M1 Signal'
          });

      return {
        success: true,
        ticket: String(order.orderId || order.positionId || order.id || order.stringOrderId),
        fillPrice: order.price || order.openPrice
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async modifyPositionProtection(positionId: string, stopLoss: number, takeProfit: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.connection) await this.connect();
      await this.connection.modifyPosition(positionId, stopLoss, takeProfit);
      return { success: true };
    } catch (err: any) {
      console.error(`[METAAPI] Failed to modify SL/TP for position ${positionId}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  async getOpenPositions(): Promise<Trade[]> {
    try {
      if (!this.connection) await this.connect();
      const positions = await this.connection.getPositions();
      
      return positions.map((p: any) => ({
        ticket: p.id,
        symbol: p.symbol,
        action: p.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL',
        lotSize: p.volume,
        openPrice: p.openPrice,
        sl: p.stopLoss || 0,
        tp: p.takeProfit || 0,
        openTime: p.time,
        profit: p.unrealizedProfit || 0
      }));
    } catch (err) {
      return [];
    }
  }

  async closePosition(ticket: string): Promise<boolean> {
    try {
      if (!this.connection) await this.connect();
      await this.connection.closePosition(ticket);
      return true;
    } catch (err) {
      return false;
    }
  }

  async closeAllPositions(): Promise<{ success: boolean; closedCount: number; errors?: string[] }> {
    try {
      if (!this.connection) await this.connect();
      const positions = await this.connection.getPositions();
      let closedCount = 0;
      const errors: string[] = [];

      for (const p of positions) {
        try {
          await this.connection.closePosition(p.id);
          closedCount++;
        } catch (e: any) {
          errors.push(`Failed to close ${p.id}: ${e.message}`);
        }
      }
      return { success: errors.length === 0, closedCount, errors: errors.length > 0 ? errors : undefined };
    } catch (err: any) {
      return { success: false, closedCount: 0, errors: [err.message] };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.connect();
      const info = await this.connection.getAccountInformation();
      return { success: true, message: `Connected to ${info.broker} - ${info.name}` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
