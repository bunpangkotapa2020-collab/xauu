import { UserSettings, BotState } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  lotSize: 0.05,
  slPips: 80,
  tpPips: 100,
  maxOpenPositions: 1,
  dailyLossLimit: 50,
  dailyTradeLimit: 10,
  tradingEnabled: false, // Default START = OFF
  emergencyStop: false,
  tradingMode: 'PAPER', // Default Mode = PAPER
  symbolMapping: {
    'XAUUSD': 'XAUUSDc',
    'GOLD': 'XAUUSDc'
  },
  webhookSecret: process.env.DARA_WEBHOOK_SECRET || 'CHANGE_ME',
  metaApi: {
    accountId: '',
    token: '',
    region: 'new-york',
    connected: false,
    status: 'DISCONNECTED'
  },
  tradingHours: {
    enabled: true,
    startHour: '08:00',
    stopHour: '21:00'
  }
};

export const initialState: BotState = {
  settings: DEFAULT_SETTINGS,
  openPositions: [],
  dailyPnL: 0,
  dailyTradeCount: 0,
  isInsideTradingWindow: false,
  signalHistory: []
};
