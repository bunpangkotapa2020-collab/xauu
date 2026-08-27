export type BotStatus = 'running' | 'paused' | 'stopped' | 'daily_limit_hit';
export type AccountType = 'cent' | 'standard'; // 'cent' (USC) or 'standard' (USD)
export type TradeSide = 'BUY' | 'SELL';

export interface TradeOrder {
  id: string;
  magicNumber: number; // 778899 for Bot, 0 or custom for manual trades
  isBotTrade: boolean;
  symbol: 'XAUUSD';
  side: TradeSide;
  lot: number;
  entryPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  floatingProfit: number;
  openedAt: string;
}

export interface TradingHoursConfig {
  enabled: boolean;
  startHour: string; // "08:00"
  stopHour: string;  // "22:00"
}

export interface RiskConfig {
  maxDailyLoss: number; // in account currency (e.g., $50 for standard, 5000 USC for cent)
  maxDrawdownPercent: number; // 5%
  maxSpreadPoints: number; // 30 points
  lotSize: number; // 0.01
  stopLossPips: number; // 25 pips ($2.50 on Gold)
  takeProfitPips: number; // 35 pips ($3.50 on Gold)
  trailingStopEnabled: boolean;
  noMartingale: boolean;
  noGrid: boolean;
}

export interface MT5Account {
  accountType: AccountType;
  server: string;
  loginId: string;
  isConnected: boolean;
  vpsOnline: boolean;
  balance: number;
  equity: number;
  currency: 'USD' | 'USC';
}

export interface BotState {
  status: BotStatus;
  isDemo: boolean;
  goldPrice: number;
  spreadPoints: number;
  account: MT5Account;
  todayProfitLoss: number;
  todayTradeCount: number;
  todayWinCount: number;
  todayLossCount: number;
  currentTrade: TradeOrder | null;
  manualTrades: TradeOrder[]; // Simulating coexistence with manual user trades
  tradingHours: TradingHoursConfig;
  riskConfig: RiskConfig;
  serverTime: string;
  isInsideTradingHours: boolean;
  dailyLossLimitHit: boolean;
  magicNumber: number;
  statusMessageKhmer: string;
}
