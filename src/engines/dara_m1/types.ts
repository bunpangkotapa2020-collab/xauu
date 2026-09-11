/**
 * ============================================================================
 * 🔥 DaRa M1 EA v1.0 — TYPE DEFINITIONS
 * 100% ISOLATED & INDEPENDENT FROM LEGACY EA
 * ============================================================================
 */

export interface DaRaCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type DaRaDirection = 'BUY' | 'SELL';

export type DaRaExitReason =
  | 'TP_HIT'
  | 'SL_HIT'
  | 'TRAILING_SL_HIT' |
  'PROFIT_LOCK_HIT'
  | 'MANUAL_CLOSE'
  | 'CLOSE_ALL'
  | 'BROKER_REJECTION'
  | 'CONNECTION_LOSS';

export interface DaRaClosedTrade {
  ticket: string | number;
  symbol: string;
  type: DaRaDirection;
  lot: number;
  openPrice: number;
  closePrice: number;
  sl: number;
  tp: number;
  originalTp?: number;
  trailingActivated?: boolean;
  pnl: number;
  exitReason: DaRaExitReason;
  closedAt: number;
}

export type DaRaState =
  | 'IDLE'                   // Stopped or waiting for start
  | 'SCANNING'               // 24/7 Scanning M1 market for Liquidity Sweep
  | 'DISPLACEMENT_DETECTED'  // M1 displacement confirmed after sweep
  | 'MSS_CONFIRMED'          // M1 MSS confirmed
  | 'SETUP_READY'            // Full setup ready, immutable entry locked
  | 'WAIT_FOR_LOCKED_ENTRY'  // Waiting for price to hit locked entry (or virtual TP/SL cancel)
  | 'EXECUTING'              // Sending order to broker
  | 'TRADE_ACTIVE'           // Broker ticket confirmed, profit trailing active
  | 'TRADE_CLOSED'           // Trade closed (TP hit, SL hit, or Trailing SL hit)
  | 'SETUP_CANCELED';        // Virtual TP or Virtual SL touched before entry

export interface DaRaSetupTrailingState {
  activated: boolean;
  profitLockActivated?: boolean;
  highestBasketNetProfit?: number;
  activatedAt?: number;
  activationPrice?: number;
  initialHiddenSL?: number;
  currentHiddenSL?: number;
  highestPrice?: number;
  lowestPrice?: number;
}

export interface DaRaSetup {
  id: string;
  direction: DaRaDirection;
  sweepLevel: number;
  sweepTime: number;
  displacementConfirmed: boolean;
  mssLevel: number;
  mssTime: number;
  lockedEntryPrice: number;
  signalPrice?: number;
  
  // 5-Level Entry System
  entryLevels?: { targetPrice: number; executed: boolean; ticket?: string | number }[];
  positionsOpened?: number;
  sharedSL?: number;
  sharedTP?: number;
  trailingState?: DaRaSetupTrailingState;

  virtualSLPrice: number;
  virtualTPPrice: number;
  userSlDistance: number;
  userTpDistance: number;
  createdAt: number;
  status: 'PENDING_ENTRY' | 'EXECUTED' | 'CANCELED';
  cancellationReason?: 'VIRTUAL_TP_REACHED' | 'VIRTUAL_SL_REACHED' | 'EXPIRED' | 'USER_STOP';
}

export interface DaRaUserSettings {
  liveTradingEnabled?: boolean;
  lotSize: number;
  slDistance: number;          // Stop Loss (Price Distance) - Direct price distance from entry (e.g. 10 means Entry ± 10)
  tpDistance: number;          // Take Profit (Price Distance) - Direct price distance from entry (e.g. 10 means Entry ± 10)
  dailyLossLimit: number;      // Maximum loss currency/USD/USC per day
  maxOpenTrades: number;       // Usually 1 for single position or user-defined
  maxConsecutiveSL: number;    // Stop EA after N consecutive SL hits
  cooldownMinutes: number;     // Cooldown duration after a real loss (in minutes)
  maxSpreadPoints: number;     // Max allowable spread in points
  newsFilterEnabled: boolean;  // Whether news filter is active
  newsMinsBefore: number;      // Mins before high impact news
  newsMinsAfter: number;       // Mins after high impact news
  trailingEnabled: boolean;
  entryDistance?: number;              // Pullback Entry Distance Pos #1 (e.g. 2.0 raw price)
  trailingDistance?: number;   // Auto fixed 1.5 Price Distance (dynamic)
  trailingRule?: string;       // Rule description: Auto at Original TP (1.5 Price Distance)
  trailingTriggerPips?: number;// [DEPRECATED / LEGACY]: DaRa Auto Trailing starts at Original TP automatically
  trailingDistancePips?: number;// [DEPRECATED / LEGACY]: DaRa Auto Trailing uses 1.5 Price Distance automatically
}

export interface DaRaPosition {
  ticket: string | number;
  symbol: string;
  type: DaRaDirection;
  lot: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  originalTp?: number;
  originalSl?: number;
  trailingActivated?: boolean;
  openTime: number;
  highestPriceSinceOpen?: number;
  lowestPriceSinceOpen?: number;
  lastTrailingSl?: number;
  unrealizedProfit?: number;
  commission?: number;
  swap?: number;
}

export interface DaRaMarketFeed {
  symbol: string;
  bid: number;
  ask: number;
  spreadPoints: number;
  serverTime: number;
  time?: number;
  m1Candles: DaRaCandle[];
  openTradesCount?: number;
}

export interface DaRaSafetyStatus {
  isSafeToTrade: boolean;
  blockedReason?: string;
  isDailyLossHit: boolean;
  isMaxConsecutiveSLHit: boolean;
  isInCooldown: boolean;
  isSpreadTooHigh: boolean;
  isNewsBlocked: boolean;
  isMaxTradesReached: boolean;
  isMt5Disconnected: boolean;
}

export interface DaRaAnalysisDetails {
  recentSwingHigh: { price: number; time: number; index: number } | null;
  recentSwingLow: { price: number; time: number; index: number } | null;
  liquiditySweep: {
    buy: 'DETECTED' | 'NOT DETECTED';
    sell: 'DETECTED' | 'NOT DETECTED';
    buyLevel?: number;
    buyTime?: number;
    sellLevel?: number;
    sellTime?: number;
  };
  displacement: {
    buy: 'CONFIRMED' | 'WAITING';
    sell: 'CONFIRMED' | 'WAITING';
  };
  mss: {
    buy: 'CONFIRMED' | 'WAITING';
    sell: 'CONFIRMED' | 'WAITING';
    buyLevel?: number;
    sellLevel?: number;
  };
  setupDirection: 'BUY' | 'SELL' | 'NONE';
  setupReason: string;
  candlesCount: number;
  lastCandleTime: number;
  currentCandle?: DaRaCandle;
  previousCandle?: DaRaCandle;
}

export interface DaRaTelemetry {
  isRunning: boolean;
  state: DaRaState;
  setup: DaRaSetup | null;
  activePosition: DaRaPosition | null;
  lastClosedTrade: DaRaClosedTrade | null;
  safety: DaRaSafetyStatus;
  analysis: DaRaAnalysisDetails | null;
  settings: DaRaUserSettings;
  cachedPointSize: number;
  dailyLossAccumulated: number;
  consecutiveLossCount: number;
  lastLossTime: number;
  scanBaselineTime?: number;
}

export interface DaRaBrokerInterface {
  sendOrder(order: {
    symbol: string;
    type: DaRaDirection;
    lot: number;
    openPrice: number;
    sl: number;
    tp: number;
    comment: string;
  }): Promise<{ success: boolean; ticket?: string | number; error?: string }>;

  modifyPosition(ticket: string | number, newSl: number, newTp?: number): Promise<{ success: boolean; error?: string }>;
  closePosition?(ticket: string | number): Promise<{ success: boolean; error?: string }>;

  getOpenPositions(symbol: string): Promise<DaRaPosition[]>;
  getSymbolInfo(symbol: string): Promise<{ pointSize: number }>;

  getClosedDeal?(ticket: string | number): Promise<{
    found: boolean;
    profit?: number;
    price?: number;
    reason?: string;
    comment?: string;
  }>;
}

export interface DaRaTelegramInterface {
  notify(title: string, message: string, dedupeKey?: string): Promise<void>;
}
