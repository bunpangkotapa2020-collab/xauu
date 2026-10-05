export type Action = 'BUY' | 'SELL';

export interface TradingViewSignal {
  action: Action;
  symbol: string;
  price: number;
  signal_id: string;
  secret: string;
}

export type ExecutionStatus = 'RECEIVED' | 'VALIDATED' | 'BLOCKED' | 'EXECUTED' | 'FAILED' | 'DUPLICATE';

export interface AuditLog {
  timestamp: string;
  signal_id: string;
  action: Action | 'UNKNOWN';
  symbol: string;
  tv_price: number;
  auth_result: 'PASS' | 'FAIL';
  duplicate_result: 'PASS' | 'FAIL';
  risk_result: 'PASS' | 'FAIL';
  execution_status: ExecutionStatus;
  broker_ticket?: string;
  actual_fill_price?: number;
  sl?: number;
  tp?: number;
  protection_status?: 'PROTECTED' | 'UNPROTECTED' | 'FAILED';
  block_reason?: string;
  error_reason?: string;
}

export interface MetaApiConfig {
  accountId: string;
  token: string;
  region: string;
  connected: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  error?: string;
}

export interface UserSettings {
  lotSize: number;
  slPips: number;
  tpPips: number;
  maxOpenPositions: number;
  dailyLossLimit: number;
  dailyTradeLimit: number;
  tradingEnabled: boolean; // START / STOP TRADING
  emergencyStop: boolean;
  tradingMode: 'PAPER' | 'LIVE';
  symbolMapping: Record<string, string>;
  webhookSecret: string;
  metaApi: MetaApiConfig;
  tradingHours: {
    enabled: boolean;
    startHour: string; // "HH:MM"
    stopHour: string;
  };
}

export interface Trade {
  ticket: string;
  symbol: string;
  action: Action;
  lotSize: number;
  openPrice: number;
  sl: number;
  tp: number;
  openTime: string;
  profit: number;
}

export interface BotState {
  settings: UserSettings;
  openPositions: Trade[];
  dailyPnL: number;
  dailyTradeCount: number;
  isInsideTradingWindow: boolean;
  lastSignal?: TradingViewSignal;
  signalHistory: AuditLog[];
}
