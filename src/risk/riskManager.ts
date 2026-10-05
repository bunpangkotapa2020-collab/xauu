import { BotState, UserSettings, TradingViewSignal } from '../types';

export class RiskManager {
  validate(state: BotState, signal: TradingViewSignal): { allowed: boolean; reason?: string } {
    const { settings, openPositions, dailyPnL, dailyTradeCount } = state;

    // 1. Emergency Stop
    if (settings.emergencyStop) {
      return { allowed: false, reason: 'EMERGENCY_STOP_ACTIVE' };
    }

    // 2. Start/Stop Trading Control
    if (!settings.tradingEnabled) {
      return { allowed: false, reason: 'TRADING_DISABLED' };
    }

    // 3. Trading Window
    if (!this.isInsideTradingWindow(settings)) {
      return { allowed: false, reason: 'OUTSIDE_TRADING_WINDOW' };
    }

    // 4. Max Open Positions
    if (openPositions.length >= settings.maxOpenPositions) {
      return { allowed: false, reason: 'MAX_OPEN_POSITIONS' };
    }

    // 5. Daily Loss Limit
    if (dailyPnL <= -settings.dailyLossLimit) {
      return { allowed: false, reason: 'DAILY_LOSS_LIMIT' };
    }

    // 6. Daily Trade Limit
    if (dailyTradeCount >= settings.dailyTradeLimit) {
      return { allowed: false, reason: 'DAILY_TRADE_LIMIT' };
    }

    return { allowed: true };
  }

  isInsideTradingWindow(settings: UserSettings): boolean {
    if (!settings.tradingHours.enabled) return true;

    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const totalMinutes = utcHour * 60 + utcMinutes;

    const [startH, startM] = settings.tradingHours.startHour.split(':').map(Number);
    const [stopH, stopM] = settings.tradingHours.stopHour.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const stopMinutes = stopH * 60 + stopM;

    return totalMinutes >= startMinutes && totalMinutes < stopMinutes;
  }

  calculateSLTP(action: 'BUY' | 'SELL', fillPrice: number, settings: UserSettings): { sl: number; tp: number } {
    const point = 0.01; // XAUUSD point (standard for XAUUSD cent/standard)
    const slDistance = settings.slPips * point;
    const tpDistance = settings.tpPips * point;

    if (action === 'BUY') {
      return {
        sl: Number((fillPrice - slDistance).toFixed(2)),
        tp: Number((fillPrice + tpDistance).toFixed(2))
      };
    } else {
      return {
        sl: Number((fillPrice + slDistance).toFixed(2)),
        tp: Number((fillPrice - tpDistance).toFixed(2))
      };
    }
  }
}

export const riskManager = new RiskManager();
