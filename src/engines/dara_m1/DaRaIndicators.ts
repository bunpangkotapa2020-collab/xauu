import { DaRaCandle } from './types.js';

/**
 * ============================================================================
 * 🔥 DaRa M1 EA v1.0 — INDICATOR SERVICE
 * LIGHTWEIGHT CALCULATIONS FOR EMA & VWAP
 * ============================================================================
 */

export class DaRaIndicators {
  /**
   * Calculate EMA (Exponential Moving Average) for a given period.
   * @param candles Array of candles (must be sorted by time ascending)
   * @param period The EMA period (e.g., 9 or 21)
   */
  static calculateEMA(candles: DaRaCandle[], period: number): number | undefined {
    if (candles.length < period) return undefined;

    const multiplier = 2 / (period + 1);
    
    // Start with SMA as the first EMA seed
    let ema = candles.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;

    // Iterate through the remaining candles to calculate EMA
    for (let i = period; i < candles.length; i++) {
      ema = (candles[i].close - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Calculate Session-Anchored VWAP (Volume Weighted Average Price).
   * Anchored at the beginning of the current UTC day.
   * @param candles Array of candles
   */
  static calculateSessionVWAP(candles: DaRaCandle[]): number | undefined {
    if (candles.length === 0) return undefined;

    // 1. Identify the session start (current UTC day)
    const latestCandle = candles[candles.length - 1];
    const latestDate = new Date(latestCandle.time).getUTCDate();
    
    // 2. Find the first candle of the current session in the provided array
    let startIndex = 0;
    for (let i = candles.length - 1; i >= 0; i--) {
      // If we cross into a different day, the session started at the next candle
      if (new Date(candles[i].time).getUTCDate() !== latestDate) {
        startIndex = i + 1;
        break;
      }
    }

    const sessionCandles = candles.slice(startIndex);
    if (sessionCandles.length === 0) return undefined;

    let totalTypicalPriceVolume = 0;
    let totalVolume = 0;

    for (const candle of sessionCandles) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      const volume = candle.volume || 1; // Default to 1 if broker doesn't provide tick volume
      
      totalTypicalPriceVolume += typicalPrice * volume;
      totalVolume += volume;
    }

    if (totalVolume === 0) return undefined;

    return totalTypicalPriceVolume / totalVolume;
  }

  /**
   * Helper to determine current session name based on UTC time.
   */
  static getSessionName(time: number): string {
    const hour = new Date(time).getUTCHours();
    
    // Roughly define sessions
    if (hour >= 0 && hour < 8) return 'ASIAN';
    if (hour >= 8 && hour < 13) return 'LONDON';
    if (hour >= 13 && hour < 21) return 'NEW_YORK';
    return 'LATE_NY';
  }
}
