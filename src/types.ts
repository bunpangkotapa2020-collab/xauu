export type BotStatus = 'running' | 'paused' | 'stopped' | 'daily_limit_hit';
export type AccountType = 'cent'; // Dedicated Cent (USC) Account
export type TradeSide = 'BUY' | 'SELL';
export type TradingAsset = 'XAUUSD';

export interface TradeOrder {
  id: string;
  magicNumber: number; // 778899 for Bot, 0 or custom for manual trades
  isBotTrade: boolean;
  symbol: string;
  side: TradeSide;
  lot: number;
  entryPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  floatingProfit: number;
  openedAt: string;
  trailingActivated?: boolean;
  highestPriceReached?: number;
  lowestPriceReached?: number;
  trailingSlValue?: number;
}

export interface TradingHoursConfig {
  enabled: boolean;
  startHour: string; // "08:00"
  stopHour: string;  // "22:00"
  startDate?: string; // "2026-08-29" (YYYY-MM-DD)
  endDate?: string;   // "2026-08-30" (YYYY-MM-DD)
  mode?: 'daily' | 'custom_date'; // 'daily' (រាល់ថ្ងៃ) or 'custom_date' (កំណត់ថ្ងៃខែជាក់លាក់)
}

export interface RiskConfig {
  liveTradingEnabled?: boolean;
  lotSizeMode?: 'fixed' | 'risk_percent'; // 'fixed' (default) or 'risk_percent'
  lotSize: number; // 0.01
  riskPercent?: number; // 1.0 (%)
  maxDailyLoss: number; // in account currency (e.g., $50 for standard, 5000 USC for cent)
  maxDrawdownPercent: number; // 5%
  maxSpreadPoints: number; // 30 points
  stopLossPips: number; // Stop Loss (Price Distance) - Direct price distance (e.g. 10 = Entry ± 10)
  takeProfitPips: number; // Take Profit (Price Distance) - Direct price distance (e.g. 10 = Entry ± 10)
  slPriceDistance?: number; // Stop Loss (Price Distance)
  tpPriceDistance?: number; // Take Profit (Price Distance)
  slDistance?: number; // Price Distance
  tpDistance?: number; // Price Distance
  entryDistance?: number; // Pullback entry distance Pos #1 (raw price)
  dailyLossCurrency?: string; // Account currency (USC for Cent account)
  trailingStopEnabled: boolean;
  profitLockTarget?: number; // Profit Lock Target (USC) - User controlled threshold
  trailingDistance?: number;
  trailingRule?: string;
  trailingStopActivationPoints?: number; // legacy points
  trailingStopDistancePoints?: number;   // legacy points
  newsFilterEnabled?: boolean;
  minutesBeforeNewsBlock?: number;
  minutesAfterNewsBlock?: number;
  maxOpenTrades: number;
  entriesPerSignal: number;
  maxConsecutiveLosses: number;
  cooldownMinutes: number;
  maxDailyLossPercent?: number;
  maxDailyLossAmount: number;
  noMartingale: boolean;
  noGrid: boolean;
}

export interface MT5ConnectionStages {
  appLoggedIn: boolean;
  mt5AccountConfigured: boolean;
  exnessServerConnected: boolean;
  marketDataFeedLive: boolean;
  tradingPermissionGranted: boolean;
  eaLoadedAndReady: boolean;
}

export interface MT5Account {
  accountType: AccountType;
  server: string;
  loginId: string;
  isConnected: boolean;
  serverConnected: boolean;
  isRealAccount: boolean;
  marketDataReceiving: boolean;
  tradingPermission: boolean;
  eaConnected: boolean;
  symbolAvailable: boolean;
  pingMs: number;
  connectionMethod: 'rest_bridge' | 'zeromq_terminal' | 'ea_socket';
  vpsOnline: boolean;
  balance: number;
  equity: number;
  freeMargin?: number;
  marginLevel?: number;
  currency: string;
  stages: MT5ConnectionStages;
}

export interface UserPreferences {
  autoStartOnConnect?: boolean;
  soundEnabled?: boolean;
  theme?: string;
}


export interface AutoRiskProfile {
  riskPerTradePercent: number;
  maxLossPerTrade: number;
  maxDailyLoss: number;
  maxDrawdownPercent: number;
  lotSize: number;
  lotPerEntry: number;
  tpPips: number;
  slPips: number;
  slPriceDistance?: number;
  tpPriceDistance?: number;
  slDistance?: number;
  tpDistance?: number;
  dailyLossCurrency?: string;
  riskRewardRatio: string;
}

export interface ICTAnalysisMonitor {
  lastAnalysisTime: number;
  status: 'ANALYZING' | 'WAITING' | 'READY' | 'ERROR';
  symbol: string;
  livePrice: {
    bid: number;
    ask: number;
    spread: number;
  };
  h4: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    structure: 'CONFIRMED' | 'WAITING';
    lastCandleTime?: string;
    candleCount: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  };
  m15: {
    liquiditySweep: 'FOUND' | 'NOT FOUND' | 'WAITING';
    cisd: 'CONFIRMED' | 'WAITING';
    swingHigh: number;
    swingLow: number;
    targetHigh: number;
    targetLow: number;
    candleCount: number;
    lastCandleTime?: string;
  };
  m1: {
    displacement: 'FOUND' | 'WAITING';
    orderBlock: 'FOUND' | 'WAITING';
    fvg: 'FOUND' | 'WAITING';
    retracement: 'FOUND' | 'WAITING';
    obZone: { high: number; low: number } | null;
    fvgZone: { high: number; low: number } | null;
    candleCount: number;
    lastCandleTime?: string;
  };
  latency?: {
    mt5TickTime: string;
    backendReceiveTime: string;
    ictAnalysisTime: string;
    lastTickAgeSeconds: number;
    latencyMs: number;
  };
  entryStatus: 'SEARCHING' | 'WAITING' | 'VALID SETUP' | 'READY TO EXECUTE' | 'TRADE OPENED';
  waitingReason: string;
  validSetup: {
    direction: 'BUY' | 'SELL';
    entry: number;
    actualEntry?: number;
    sl: number;
    tp: number;
    rr: number;
    setupId: string;
    stage?: string;
    executionState?: string;
    obHigh?: number;
    obLow?: number;
  } | null;
  systemHealth: {
    mt5Connection: boolean;
    eaBridge: boolean;
    vps: boolean;
    liveMarketData: boolean;
    dataFreshness: boolean;
    newsFilter: boolean;
    riskGuard: boolean;
    problemReason?: string;
  };
  recentLogs: Array<{
    timestamp: string;
    message: string;
    level: 'info' | 'warn' | 'success' | 'error';
  }>;
}

export interface StartConfirmedState {
  isStartRequested: boolean;
  isStartConfirmed: boolean;
  desiredBotState?: 'RUNNING' | 'STOPPED';
  startRequestedTime: string | null;
  startConfirmedTime: string | null;
  eaRunning: boolean; // Confirmed active analysis & loop
  eaHeartbeatTime: number; // Unix timestamp ms
  lastAnalysisTime: number; // Unix timestamp ms
  lastMt5TickTime: number; // Unix timestamp ms
  lastBackendSyncTime: number; // Unix timestamp ms
  runningDurationSeconds: number;
  connectionState: 'HEALTHY' | 'DISCONNECTED' | 'RECOVERING' | 'BLOCKED_FEED' | 'IDLE';
  currentAnalysisStage: string;
  currentWaitingReason: string;
  isEntriesBlocked: boolean;
  blockedReason?: string;
}

export interface BotState {
  autoRiskProfile?: AutoRiskProfile;
  ictAnalysis?: ICTAnalysisMonitor;
  startConfirmation?: StartConfirmedState;
  desiredBotState?: 'RUNNING' | 'STOPPED';
  isStartRequested?: boolean;
  startRequestedTime?: string | null;
  startConfirmedTime?: string | null;
  status: BotStatus;
  goldPrice: number;
  bidPrice?: number;
  askPrice?: number;
  lastPriceUpdate?: string;
  lastTickTime?: number;
  brokerQuoteTime?: number;
  lastFeedArrivalTime?: number;
  tickHistory?: number[];
  marketDataStatus?: string;
  newsProviderStatus?: 'CONNECTED' | 'UNAVAILABLE';
  activeGoldSymbol?: string;
  selectedAsset: TradingAsset;
  spreadPoints: number;
  marketSpeed?: 'NORMAL' | 'FAST' | 'EXTREME';
  volatilityValue?: number;
  account: MT5Account;
  todayProfitLoss: number;
  todayTradeCount: number;
  todayWinCount: number;
  todayLossCount: number;
  signals?: { gold: string };
  currentTrade: TradeOrder | null;
  openTrades: TradeOrder[];
  consecutiveLosses: number;
  cooldownUntil: number | null;
  signalDetails?: { 
    side: string; 
    symbol?: string; 
    entry: number; 
    actualEntry?: number;
    obHigh?: number;
    obLow?: number;
    lot?: number; 
    sl: number; 
    tp: number; 
    risk?: number; 
    count?: number; 
    stage?: string; 
    executionState?: string; 
    daraState?: string;
    daraSetup?: any;
    daraTelemetry?: any;
    daraAnalysis?: any;
    daraSafety?: any;
    [key: string]: any;
  };
  daraTelemetry?: any;
  manualTrades: TradeOrder[]; // Simulating coexistence with manual user trades
  tradingHours: TradingHoursConfig;
  riskConfig: RiskConfig;
  userPreferences?: UserPreferences;
  serverTime: string;
  isInsideTradingHours: boolean;
  isMarketOpen?: boolean;
  marketStatusText?: string;
  marketStatusReason?: string;
  liveEaConfig?: any;
  dailyLossLimitHit: boolean;
  magicNumber: number;
  currentCycle?: number;
  cycleStage?: string;
  statusMessageKhmer: string;
  lastSavedAt?: string;
  isAutoSaved?: boolean;
}
