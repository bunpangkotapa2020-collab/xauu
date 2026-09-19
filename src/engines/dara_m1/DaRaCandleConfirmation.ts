/**
 * ============================================================================
 * 🕯️ DaRa M1 EA v1.0 — CANDLESTICK CONFIRMATION MODULE (DaRaCandleConfirmation)
 * 100% ISOLATED ADDITIONAL CONFIRMATION LAYER
 * 
 * Sits strictly between:
 * M1 MSS CONFIRMED -> CANDLE CONFIRMATION -> LOCK ENTRY
 * 
 * Rules:
 * 1. CLOSED CANDLES ONLY. Never evaluate forming or unclosed candles.
 * 2. Direction must match:
 *    - BUY Setup -> Confirmed Bullish Candle Pattern (Bullish Engulfing, Hammer, Morning Star, Piercing)
 *    - SELL Setup -> Confirmed Bearish Candle Pattern (Bearish Engulfing, Shooting Star, Evening Star, Dark Cloud Cover)
 * 3. Pattern alone NEVER opens a trade. Core Sweep -> Displacement -> MSS is strictly required first.
 * 4. Configurable Quality Filters (Min body/range ratio, wick ratios).
 * 5. Configurable Score System (Default: 2 points per strong pattern, min required: 2 points).
 * ============================================================================
 */

import { DaRaCandle, DaRaDirection } from './types';

export type DaRaCandlePatternName =
  | 'Bullish Engulfing'
  | 'Hammer'
  | 'Morning Star'
  | 'Piercing Pattern'
  | 'Bearish Engulfing'
  | 'Shooting Star'
  | 'Evening Star'
  | 'Dark Cloud Cover'
  | 'None';

export type DaRaCandleQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DaRaCandleConfirmationResult {
  patternName: DaRaCandlePatternName;
  direction: DaRaDirection;
  score: number;
  candleIndex: number;
  candleTime: number;
  quality: DaRaCandleQuality;
  isConfirmed: boolean;
  reason?: string;
}

export interface DaRaCandleQualityConfig {
  enabled: boolean;
  minScoreRequired: number;            // Default: 2
  minBodyRangeRatio: number;           // Min body / range ratio for directional candles (e.g. 0.50)
  minHammerWickRatio: number;          // Min lower wick / range ratio for Hammer (e.g. 0.50)
  maxHammerUpperWickRatio: number;     // Max upper wick / range ratio for Hammer (e.g. 0.20)
  minStarWickRatio: number;            // Min upper wick / range ratio for Shooting Star (e.g. 0.50)
  maxStarLowerWickRatio: number;       // Max lower wick / range ratio for Shooting Star (e.g. 0.20)
  minPiercingPenetrationRatio: number; // Penetration past previous midpoint (e.g. 0.50)
  maxDojiBodyRatio: number;            // For Star middle candle (e.g. 0.30)
}

export const DEFAULT_CANDLE_QUALITY_CONFIG: DaRaCandleQualityConfig = {
  enabled: true,
  minScoreRequired: 2,
  minBodyRangeRatio: 0.50,
  minHammerWickRatio: 0.50,
  maxHammerUpperWickRatio: 0.20,
  minStarWickRatio: 0.50,
  maxStarLowerWickRatio: 0.20,
  minPiercingPenetrationRatio: 0.50,
  maxDojiBodyRatio: 0.30
};

export class DaRaCandleConfirmationModule {
  private config: DaRaCandleQualityConfig;

  constructor(customConfig?: Partial<DaRaCandleQualityConfig>) {
    this.config = { ...DEFAULT_CANDLE_QUALITY_CONFIG, ...customConfig };
  }

  public updateConfig(newConfig?: Partial<DaRaCandleQualityConfig>): void {
    if (newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
  }

  public getConfig(): DaRaCandleQualityConfig {
    return { ...this.config };
  }

  /**
   * Evaluates closed candles at or immediately following the MSS candle.
   * CLOSED CANDLES ONLY: We inspect candles up to `candles.length - 1` (completed closed candles).
   * 
   * @param candles Closed M1 candle series
   * @param direction Expected direction ('BUY' or 'SELL')
   * @param mssIndex The index of the candle where MSS was confirmed
   */
  public evaluateConfirmation(
    candles: DaRaCandle[],
    direction: DaRaDirection,
    mssIndex: number
  ): DaRaCandleConfirmationResult {
    const defaultNegative: DaRaCandleConfirmationResult = {
      patternName: 'None',
      direction,
      score: 0,
      candleIndex: -1,
      candleTime: 0,
      quality: 'LOW',
      isConfirmed: false,
      reason: 'No qualifying pattern found'
    };

    // If candle confirmation module is disabled by user, pass through with neutral confirmation
    if (!this.config.enabled) {
      return {
        patternName: 'None',
        direction,
        score: this.config.minScoreRequired,
        candleIndex: mssIndex,
        candleTime: candles[mssIndex]?.time || 0,
        quality: 'HIGH',
        isConfirmed: true,
        reason: 'Candle confirmation module disabled (pass-through enabled)'
      };
    }

    if (!candles || candles.length < 2 || mssIndex < 0 || mssIndex >= candles.length) {
      defaultNegative.reason = 'Insufficient closed candles or invalid MSS index';
      return defaultNegative;
    }

    // Inspect closed candles from mssIndex up to the most recent closed candle (candles.length - 1)
    // Candle confirmation can be on the MSS candle itself or within the next 2 closed candles
    const maxScanIdx = Math.min(candles.length - 1, mssIndex + 2);

    for (let targetIdx = maxScanIdx; targetIdx >= mssIndex; targetIdx--) {
      if (direction === 'BUY') {
        const buyResult = this.checkBuyPatterns(candles, targetIdx);
        if (buyResult.isConfirmed) {
          return buyResult;
        }
      } else if (direction === 'SELL') {
        const sellResult = this.checkSellPatterns(candles, targetIdx);
        if (sellResult.isConfirmed) {
          return sellResult;
        }
      }
    }

    return defaultNegative;
  }

  // ==========================================================================
  // BUY CANDLE PATTERNS (Bullish Engulfing, Hammer, Morning Star, Piercing)
  // ==========================================================================

  private checkBuyPatterns(candles: DaRaCandle[], idx: number): DaRaCandleConfirmationResult {
    const current = candles[idx];
    if (!current) return this.createNegativeResult('BUY');

    // 1. Bullish Engulfing (2-candle pattern: idx-1 must be Bearish, idx must be Bullish engulfing previous body)
    if (idx >= 1) {
      const prev = candles[idx - 1];
      const prevBody = prev.open - prev.close; // Bearish
      const currBody = current.close - current.open; // Bullish
      const currRange = current.high - current.low;

      if (prevBody > 0 && currBody > 0 && currRange > 0) {
        const bodyRatio = currBody / currRange;
        // Engulfing condition: current body opens <= prev close and closes >= prev open
        const isEngulfing = current.open <= prev.close + 0.05 && current.close >= prev.open - 0.05;
        if (isEngulfing && bodyRatio >= this.config.minBodyRangeRatio) {
          const score = 2;
          const quality: DaRaCandleQuality = bodyRatio >= 0.65 ? 'HIGH' : 'MEDIUM';
          return {
            patternName: 'Bullish Engulfing',
            direction: 'BUY',
            score,
            candleIndex: idx,
            candleTime: current.time,
            quality,
            isConfirmed: score >= this.config.minScoreRequired
          };
        }
      }
    }

    // 2. Hammer (Single-candle pattern: Small body at top, lower wick >= 50% of range, upper wick <= 20%)
    {
      const range = current.high - current.low;
      const body = Math.abs(current.close - current.open);
      const lowerWick = Math.min(current.open, current.close) - current.low;
      const upperWick = current.high - Math.max(current.open, current.close);

      if (range > 0) {
        const lowerWickRatio = lowerWick / range;
        const upperWickRatio = upperWick / range;
        const bodyRatio = body / range;

        // Hammer criteria: long lower wick, body near upper extreme
        if (
          lowerWickRatio >= this.config.minHammerWickRatio &&
          upperWickRatio <= this.config.maxHammerUpperWickRatio &&
          bodyRatio <= 0.40
        ) {
          const score = 2;
          const quality: DaRaCandleQuality = lowerWickRatio >= 0.65 ? 'HIGH' : 'MEDIUM';
          return {
            patternName: 'Hammer',
            direction: 'BUY',
            score,
            candleIndex: idx,
            candleTime: current.time,
            quality,
            isConfirmed: score >= this.config.minScoreRequired
          };
        }
      }
    }

    // 3. Piercing Pattern (2-candle pattern: prev is strong Bearish, curr is strong Bullish opening lower and closing above 50% of prev body)
    if (idx >= 1) {
      const prev = candles[idx - 1];
      const prevBody = prev.open - prev.close;
      const prevRange = prev.high - prev.low;
      const currBody = current.close - current.open;
      const currRange = current.high - current.low;

      if (prevBody > 0 && prevRange > 0 && currBody > 0 && currRange > 0) {
        const prevBodyRatio = prevBody / prevRange;
        const currBodyRatio = currBody / currRange;
        const prevMidpoint = prev.close + prevBody * this.config.minPiercingPenetrationRatio;

        // Opened near/below prev close, and closed above midpoint of prev bearish body (without engulfing top)
        if (
          prevBodyRatio >= this.config.minBodyRangeRatio &&
          currBodyRatio >= this.config.minBodyRangeRatio &&
          current.open <= prev.close + 0.10 &&
          current.close >= prevMidpoint &&
          current.close < prev.open
        ) {
          const score = 2;
          return {
            patternName: 'Piercing Pattern',
            direction: 'BUY',
            score,
            candleIndex: idx,
            candleTime: current.time,
            quality: 'HIGH',
            isConfirmed: score >= this.config.minScoreRequired
          };
        }
      }
    }

    // 4. Morning Star (3-candle pattern: [0] Bearish, [1] small body / doji, [2] Bullish closing deep into candle 0)
    if (idx >= 2) {
      const c1 = candles[idx - 2];
      const c2 = candles[idx - 1];
      const c3 = current;

      const c1Body = c1.open - c1.close; // Bearish
      const c1Range = c1.high - c1.low;
      const c2Body = Math.abs(c2.close - c2.open); // Star (small body)
      const c2Range = c2.high - c2.low;
      const c3Body = c3.close - c3.open; // Bullish
      const c3Range = c3.high - c3.low;

      if (c1Body > 0 && c1Range > 0 && c2Range > 0 && c3Body > 0 && c3Range > 0) {
        const c1BodyRatio = c1Body / c1Range;
        const c2BodyRatio = c2Body / c2Range;
        const c3BodyRatio = c3Body / c3Range;
        const c1Midpoint = c1.close + c1Body * 0.50;

        if (
          c1BodyRatio >= 0.45 &&
          c2BodyRatio <= this.config.maxDojiBodyRatio &&
          c3BodyRatio >= 0.45 &&
          c3.close >= c1Midpoint
        ) {
          const score = 2;
          return {
            patternName: 'Morning Star',
            direction: 'BUY',
            score,
            candleIndex: idx,
            candleTime: current.time,
            quality: 'HIGH',
            isConfirmed: score >= this.config.minScoreRequired
          };
        }
      }
    }

    return this.createNegativeResult('BUY');
  }

  // ==========================================================================
  // SELL CANDLE PATTERNS (Bearish Engulfing, Shooting Star, Evening Star, Dark Cloud Cover)
  // ==========================================================================

  private checkSellPatterns(candles: DaRaCandle[], idx: number): DaRaCandleConfirmationResult {
    const current = candles[idx];
    if (!current) return this.createNegativeResult('SELL');

    // 1. Bearish Engulfing (2-candle pattern: idx-1 must be Bullish, idx must be Bearish engulfing previous body)
    if (idx >= 1) {
      const prev = candles[idx - 1];
      const prevBody = prev.close - prev.open; // Bullish
      const currBody = current.open - current.close; // Bearish
      const currRange = current.high - current.low;

      if (prevBody > 0 && currBody > 0 && currRange > 0) {
        const bodyRatio = currBody / currRange;
        // Engulfing condition: current body opens >= prev close and closes <= prev open
        const isEngulfing = current.open >= prev.close - 0.05 && current.close <= prev.open + 0.05;
        if (isEngulfing && bodyRatio >= this.config.minBodyRangeRatio) {
          const score = 2;
          const quality: DaRaCandleQuality = bodyRatio >= 0.65 ? 'HIGH' : 'MEDIUM';
          return {
            patternName: 'Bearish Engulfing',
            direction: 'SELL',
            score,
            candleIndex: idx,
            candleTime: current.time,
            quality,
            isConfirmed: score >= this.config.minScoreRequired
          };
        }
      }
    }

    // 2. Shooting Star (Single-candle pattern: Small body at bottom, upper wick >= 50% of range, lower wick <= 20%)
    {
      const range = current.high - current.low;
      const body = Math.abs(current.close - current.open);
      const upperWick = current.high - Math.max(current.open, current.close);
      const lowerWick = Math.min(current.open, current.close) - current.low;

      if (range > 0) {
        const upperWickRatio = upperWick / range;
        const lowerWickRatio = lowerWick / range;
        const bodyRatio = body / range;

        if (
          upperWickRatio >= this.config.minStarWickRatio &&
          lowerWickRatio <= this.config.maxStarLowerWickRatio &&
          bodyRatio <= 0.40
        ) {
          const score = 2;
          const quality: DaRaCandleQuality = upperWickRatio >= 0.65 ? 'HIGH' : 'MEDIUM';
          return {
            patternName: 'Shooting Star',
            direction: 'SELL',
            score,
            candleIndex: idx,
            candleTime: current.time,
            quality,
            isConfirmed: score >= this.config.minScoreRequired
          };
        }
      }
    }

    // 3. Dark Cloud Cover (2-candle pattern: prev is strong Bullish, curr is strong Bearish opening higher and closing below 50% of prev body)
    if (idx >= 1) {
      const prev = candles[idx - 1];
      const prevBody = prev.close - prev.open;
      const prevRange = prev.high - prev.low;
      const currBody = current.open - current.close;
      const currRange = current.high - current.low;

      if (prevBody > 0 && prevRange > 0 && currBody > 0 && currRange > 0) {
        const prevBodyRatio = prevBody / prevRange;
        const currBodyRatio = currBody / currRange;
        const prevMidpoint = prev.open + prevBody * (1 - this.config.minPiercingPenetrationRatio);

        if (
          prevBodyRatio >= this.config.minBodyRangeRatio &&
          currBodyRatio >= this.config.minBodyRangeRatio &&
          current.open >= prev.close - 0.10 &&
          current.close <= prevMidpoint &&
          current.close > prev.open
        ) {
          const score = 2;
          return {
            patternName: 'Dark Cloud Cover',
            direction: 'SELL',
            score,
            candleIndex: idx,
            candleTime: current.time,
            quality: 'HIGH',
            isConfirmed: score >= this.config.minScoreRequired
          };
        }
      }
    }

    // 4. Evening Star (3-candle pattern: [0] Bullish, [1] small body / star, [2] Bearish closing deep into candle 0)
    if (idx >= 2) {
      const c1 = candles[idx - 2];
      const c2 = candles[idx - 1];
      const c3 = current;

      const c1Body = c1.close - c1.open; // Bullish
      const c1Range = c1.high - c1.low;
      const c2Body = Math.abs(c2.close - c2.open); // Star (small body)
      const c2Range = c2.high - c2.low;
      const c3Body = c3.open - c3.close; // Bearish
      const c3Range = c3.high - c3.low;

      if (c1Body > 0 && c1Range > 0 && c2Range > 0 && c3Body > 0 && c3Range > 0) {
        const c1BodyRatio = c1Body / c1Range;
        const c2BodyRatio = c2Body / c2Range;
        const c3BodyRatio = c3Body / c3Range;
        const c1Midpoint = c1.open + c1Body * 0.50;

        if (
          c1BodyRatio >= 0.45 &&
          c2BodyRatio <= this.config.maxDojiBodyRatio &&
          c3BodyRatio >= 0.45 &&
          c3.close <= c1Midpoint
        ) {
          const score = 2;
          return {
            patternName: 'Evening Star',
            direction: 'SELL',
            score,
            candleIndex: idx,
            candleTime: current.time,
            quality: 'HIGH',
            isConfirmed: score >= this.config.minScoreRequired
          };
        }
      }
    }

    return this.createNegativeResult('SELL');
  }

  private createNegativeResult(direction: DaRaDirection): DaRaCandleConfirmationResult {
    return {
      patternName: 'None',
      direction,
      score: 0,
      candleIndex: -1,
      candleTime: 0,
      quality: 'LOW',
      isConfirmed: false,
      reason: `No qualifying ${direction} candlestick confirmation pattern found`
    };
  }
}
