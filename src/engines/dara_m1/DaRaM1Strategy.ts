/**
 * ============================================================================
 * 🔥 DaRa M1 EA v1.0 — STRATEGY ENGINE (DaRaM1Strategy)
 * 100% INDEPENDENT M1 ONLY STRATEGY
 * 
 * Rules:
 * M1 MARKET -> SWEEP -> DISPLACEMENT -> MSS -> FULL SETUP READY -> LOCK ENTRY
 * - BUY: Sweep M1 Swing Low -> Close above -> Bullish Displacement -> Bullish MSS (Close above prior M1 Swing High)
 * - SELL: Sweep M1 Swing High -> Close below -> Bearish Displacement -> Bearish MSS (Close below prior M1 Swing Low)
 * - Fast Entry: No unnecessary heavy multi-timeframe filters.
 * ============================================================================
 */

import { DaRaCandle, DaRaDirection, DaRaSetup, DaRaUserSettings, DaRaAnalysisDetails } from './types';

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  type: 'HIGH' | 'LOW';
}

export class DaRaM1Strategy {
  private lastProcessedMssTime: number = 0;
  private scanBaselineTime: number = 0;

  public markSetupProcessed(direction: string, mssTime: number): void {
    if (mssTime > this.lastProcessedMssTime) {
      this.lastProcessedMssTime = mssTime;
    }
  }

  public setScanBaselineTime(time: number, force: boolean = false): void {
    if (force || time > this.scanBaselineTime) {
      this.scanBaselineTime = time;
    }
    if (force || time > this.lastProcessedMssTime) {
      this.lastProcessedMssTime = time;
    }
  }

  public getScanBaselineTime(): number {
    return this.scanBaselineTime;
  }

  public reset(): void {
    this.lastProcessedMssTime = 0;
    this.scanBaselineTime = 0;
  }

  /**
   * Identifies recent M1 swing points with standard fractal lookback (2 bars left, 2 bars right).
   */
  public findRecentSwings(candles: DaRaCandle[], lookback: number = 40): { swingHighs: SwingPoint[]; swingLows: SwingPoint[] } {
    const swingHighs: SwingPoint[] = [];
    const swingLows: SwingPoint[] = [];

    if (candles.length < 5) {
      return { swingHighs, swingLows };
    }

    const startIdx = Math.max(2, candles.length - lookback);
    const endIdx = candles.length - 2;

    for (let i = startIdx; i <= endIdx; i++) {
      const prev2 = candles[i - 2];
      const prev1 = candles[i - 1];
      const curr = candles[i];
      const next1 = candles[i + 1];
      const next2 = i + 2 < candles.length ? candles[i + 2] : null;

      const isSwingHigh =
        curr.high > prev1.high &&
        curr.high > prev2.high &&
        curr.high >= next1.high &&
        (!next2 || curr.high >= next2.high);

      if (isSwingHigh) {
        swingHighs.push({
          index: i,
          time: curr.time,
          price: curr.high,
          type: 'HIGH'
        });
      }

      const isSwingLow =
        curr.low < prev1.low &&
        curr.low < prev2.low &&
        curr.low <= next1.low &&
        (!next2 || curr.low <= next2.low);

      if (isSwingLow) {
        swingLows.push({
          index: i,
          time: curr.time,
          price: curr.low,
          type: 'LOW'
        });
      }
    }

    return { swingHighs, swingLows };
  }

  /**
   * Evaluates closed M1 candles for DaRa M1 setups
   */
  public scanForSetup(
    candles: DaRaCandle[],
    settings: DaRaUserSettings,
    pointSize: number = 0.01
  ): DaRaSetup | null {
    if (!candles || !Array.isArray(candles) || candles.length < 10) return null;

    const { swingHighs, swingLows } = this.findRecentSwings(candles, 50);

    // Check BUY Setup
    const buySetup = this.checkBuySetup(candles, swingHighs, swingLows, settings, pointSize);
    if (buySetup) return buySetup;

    // Check SELL Setup
    const sellSetup = this.checkSellSetup(candles, swingHighs, swingLows, settings, pointSize);
    if (sellSetup) return sellSetup;

    return null;
  }

  /**
   * BUY Setup Validation:
   * 1. Sweep recent M1 Swing Low (Wick below, close above)
   * 2. Bullish Displacement (Impulsive green body)
   * 3. Bullish MSS (Close above prior M1 Swing High)
   */
  private checkBuySetup(
    candles: DaRaCandle[],
    swingHighs: SwingPoint[],
    swingLows: SwingPoint[],
    settings: DaRaUserSettings,
    pointSize: number
  ): DaRaSetup | null {
    if (swingLows.length === 0 || swingHighs.length === 0) return null;

    // Check recent swing lows in reverse order
    for (let sIdx = swingLows.length - 1; sIdx >= 0; sIdx--) {
      const swLow = swingLows[sIdx];

      if (swLow.index >= candles.length - 2) continue;

      // Find sweep candle: dipped below swLow.price, but closed ABOVE swLow.price
      let sweepIdx = -1;
      for (let i = swLow.index + 1; i < candles.length; i++) {
        const c = candles[i];
        if (c.low < swLow.price && c.close > swLow.price) {
          // Any Sweep formed BEFORE or DURING previous trade must NOT be eligible
          if (this.scanBaselineTime > 0 && c.time <= this.scanBaselineTime) {
            continue;
          }
          sweepIdx = i;
          break;
        }
      }

      if (sweepIdx === -1) continue;

      // Find Bullish Displacement at or after sweep
      let displacementFound = false;
      let displacementIdx = -1;
      for (let i = sweepIdx; i < candles.length; i++) {
        const c = candles[i];
        if (this.scanBaselineTime > 0 && c.time <= this.scanBaselineTime) {
          continue;
        }
        const body = c.close - c.open;
        const range = c.high - c.low;
        if (body > 0 && range > 0 && body / range >= 0.45) {
          displacementFound = true;
          displacementIdx = i;
          break;
        }
      }

      if (!displacementFound) continue;

      // Find relevant PRIOR Swing High formed BEFORE the displacement
      const priorHighs = swingHighs.filter(h => h.index >= swLow.index - 5 && h.index <= displacementIdx && h.price > swLow.price);
      if (priorHighs.length === 0) continue;

      const targetSwingHigh = priorHighs[priorHighs.length - 1];

      // MSS: Candle closes strictly ABOVE targetSwingHigh
      let mssConfirmed = false;
      let mssCandle: DaRaCandle | null = null;
      for (let i = displacementIdx; i < candles.length; i++) {
        const c = candles[i];
        if (this.scanBaselineTime > 0 && c.time <= this.scanBaselineTime) {
          continue;
        }
        if (c.close > targetSwingHigh.price) {
          mssConfirmed = true;
          mssCandle = c;
          break;
        }
      }

      if (mssConfirmed && mssCandle) {
        if (this.scanBaselineTime > 0 && (mssCandle.time <= this.scanBaselineTime || candles[sweepIdx].time <= this.scanBaselineTime)) {
          return null; // Formed before or during previous trade. Discard stale setup.
        }
        if (this.lastProcessedMssTime > 0 && mssCandle.time <= this.lastProcessedMssTime) {
          return null; // This setup (or a newer one) was already processed. Discard old setups.
        }

        const lockedEntry = targetSwingHigh.price;
        const userSl = settings.slDistance;
        const userTp = settings.tpDistance;
        
        // Direct price distance: USER INPUT NUMBER = DIRECT PRICE DISTANCE (NO CONVERSION)
        const slPriceDistance = userSl;
        const tpPriceDistance = userTp;

        return {
          id: `DARA_BUY_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          direction: 'BUY',
          sweepLevel: swLow.price,
          sweepTime: candles[sweepIdx].time,
          displacementConfirmed: true,
          mssLevel: targetSwingHigh.price,
          mssTime: mssCandle.time,
          lockedEntryPrice: lockedEntry,
          virtualSLPrice: Number((lockedEntry - slPriceDistance).toFixed(3)),
          virtualTPPrice: Number((lockedEntry + tpPriceDistance).toFixed(3)),
          userSlDistance: userSl,
          userTpDistance: userTp,
          createdAt: Date.now(),
          status: 'PENDING_ENTRY'
        };
      }
    }

    return null;
  }

  /**
   * SELL Setup Validation:
   * 1. Sweep recent M1 Swing High (Wick above, close below)
   * 2. Bearish Displacement (Impulsive red body)
   * 3. Bearish MSS (Close below prior M1 Swing Low)
   */
  private checkSellSetup(
    candles: DaRaCandle[],
    swingHighs: SwingPoint[],
    swingLows: SwingPoint[],
    settings: DaRaUserSettings,
    pointSize: number
  ): DaRaSetup | null {
    if (swingHighs.length === 0 || swingLows.length === 0) return null;

    for (let sIdx = swingHighs.length - 1; sIdx >= 0; sIdx--) {
      const swHigh = swingHighs[sIdx];

      if (swHigh.index >= candles.length - 2) continue;

      let sweepIdx = -1;
      for (let i = swHigh.index + 1; i < candles.length; i++) {
        const c = candles[i];
        if (c.high > swHigh.price && c.close < swHigh.price) {
          // Any Sweep formed BEFORE or DURING previous trade must NOT be eligible
          if (this.scanBaselineTime > 0 && c.time <= this.scanBaselineTime) {
            continue;
          }
          sweepIdx = i;
          break;
        }
      }

      if (sweepIdx === -1) continue;

      let displacementFound = false;
      let displacementIdx = -1;
      for (let i = sweepIdx; i < candles.length; i++) {
        const c = candles[i];
        if (this.scanBaselineTime > 0 && c.time <= this.scanBaselineTime) {
          continue;
        }
        const body = c.open - c.close;
        const range = c.high - c.low;
        if (body > 0 && range > 0 && body / range >= 0.45) {
          displacementFound = true;
          displacementIdx = i;
          break;
        }
      }

      if (!displacementFound) continue;

      // Find relevant PRIOR Swing Low formed BEFORE the displacement
      const priorLows = swingLows.filter(l => l.index >= swHigh.index - 5 && l.index <= displacementIdx && l.price < swHigh.price);
      if (priorLows.length === 0) continue;

      const targetSwingLow = priorLows[priorLows.length - 1];

      let mssConfirmed = false;
      let mssCandle: DaRaCandle | null = null;
      for (let i = displacementIdx; i < candles.length; i++) {
        const c = candles[i];
        if (this.scanBaselineTime > 0 && c.time <= this.scanBaselineTime) {
          continue;
        }
        if (c.close < targetSwingLow.price) {
          mssConfirmed = true;
          mssCandle = c;
          break;
        }
      }

      if (mssConfirmed && mssCandle) {
        if (this.scanBaselineTime > 0 && (mssCandle.time <= this.scanBaselineTime || candles[sweepIdx].time <= this.scanBaselineTime)) {
          return null; // Formed before or during previous trade. Discard stale setup.
        }
        if (this.lastProcessedMssTime > 0 && mssCandle.time <= this.lastProcessedMssTime) {
          return null; // This setup (or a newer one) was already processed. Discard old setups.
        }

        const lockedEntry = targetSwingLow.price;
        const userSl = settings.slDistance;
        const userTp = settings.tpDistance;
        
        // Direct price distance: USER INPUT NUMBER = DIRECT PRICE DISTANCE (NO CONVERSION)
        const slPriceDistance = userSl;
        const tpPriceDistance = userTp;

        return {
          id: `DARA_SELL_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          direction: 'SELL',
          sweepLevel: swHigh.price,
          sweepTime: candles[sweepIdx].time,
          displacementConfirmed: true,
          mssLevel: targetSwingLow.price,
          mssTime: mssCandle.time,
          lockedEntryPrice: lockedEntry,
          virtualSLPrice: Number((lockedEntry + slPriceDistance).toFixed(3)),
          virtualTPPrice: Number((lockedEntry - tpPriceDistance).toFixed(3)),
          userSlDistance: userSl,
          userTpDistance: userTp,
          createdAt: Date.now(),
          status: 'PENDING_ENTRY'
        };
      }
    }

    return null;
  }

  /**
   * Generates live transparency analysis details from recent closed M1 candles.
   * Does NOT alter any strategy logic.
   */
  public getAnalysisDetails(
    candles: DaRaCandle[],
    settings: DaRaUserSettings,
    pointSize: number = 0.01
  ): DaRaAnalysisDetails {
    if (!candles || !Array.isArray(candles) || candles.length < 10) {
      return {
        recentSwingHigh: null,
        recentSwingLow: null,
        liquiditySweep: { buy: 'NOT DETECTED', sell: 'NOT DETECTED' },
        displacement: { buy: 'WAITING', sell: 'WAITING' },
        mss: { buy: 'WAITING', sell: 'WAITING' },
        setupDirection: 'NONE',
        setupReason: 'INSUFFICIENT CANDLE DATA (< 10 BARS)',
        candlesCount: candles ? candles.length : 0,
        lastCandleTime: 0
      };
    }

    const { swingHighs, swingLows } = this.findRecentSwings(candles, 50);
    const recentSwingHigh = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : null;
    const recentSwingLow = swingLows.length > 0 ? swingLows[swingLows.length - 1] : null;

    const currentCandle = candles[candles.length - 1];
    const previousCandle = candles.length >= 2 ? candles[candles.length - 2] : undefined;

    const details: DaRaAnalysisDetails = {
      recentSwingHigh: recentSwingHigh ? { price: recentSwingHigh.price, time: recentSwingHigh.time, index: recentSwingHigh.index } : null,
      recentSwingLow: recentSwingLow ? { price: recentSwingLow.price, time: recentSwingLow.time, index: recentSwingLow.index } : null,
      liquiditySweep: { buy: 'NOT DETECTED', sell: 'NOT DETECTED' },
      displacement: { buy: 'WAITING', sell: 'WAITING' },
      mss: { buy: 'WAITING', sell: 'WAITING' },
      setupDirection: 'NONE',
      setupReason: 'SCANNING — NO VALID SETUP',
      candlesCount: candles.length,
      lastCandleTime: currentCandle.time,
      currentCandle,
      previousCandle
    };

    // Evaluate BUY Setup progress
    if (recentSwingLow && swingLows.length > 0) {
      for (let sIdx = swingLows.length - 1; sIdx >= 0; sIdx--) {
        const swLow = swingLows[sIdx];
        if (swLow.index >= candles.length - 2) continue;

        let sweepIdx = -1;
        for (let i = swLow.index + 1; i < candles.length; i++) {
          const c = candles[i];
          if (c.low < swLow.price && c.close > swLow.price) {
            sweepIdx = i;
            break;
          }
        }

        if (sweepIdx !== -1) {
          details.liquiditySweep.buy = 'DETECTED';
          details.liquiditySweep.buyLevel = swLow.price;
          details.liquiditySweep.buyTime = candles[sweepIdx].time;

          // Check displacement
          let dispIdx = -1;
          for (let i = sweepIdx; i < candles.length; i++) {
            const c = candles[i];
            const body = c.close - c.open;
            const range = c.high - c.low;
            if (body > 0 && range > 0 && body / range >= 0.45) {
              dispIdx = i;
              break;
            }
          }

          if (dispIdx !== -1) {
            details.displacement.buy = 'CONFIRMED';

            const priorHighs = swingHighs.filter(h => h.index >= swLow.index - 5 && h.index <= dispIdx && h.price > swLow.price);
            if (priorHighs.length > 0) {
              const targetHigh = priorHighs[priorHighs.length - 1];
              for (let i = dispIdx; i < candles.length; i++) {
                if (candles[i].close > targetHigh.price) {
                  details.mss.buy = 'CONFIRMED';
                  details.mss.buyLevel = targetHigh.price;
                  details.setupDirection = 'BUY';
                  details.setupReason = 'VALID BUY SETUP CONFIRMED (Sweep + Displacement + MSS)';
                  break;
                }
              }
            }
          }
          break; // evaluated latest relevant low
        }
      }
    }

    // Evaluate SELL Setup progress
    if (recentSwingHigh && swingHighs.length > 0) {
      for (let sIdx = swingHighs.length - 1; sIdx >= 0; sIdx--) {
        const swHigh = swingHighs[sIdx];
        if (swHigh.index >= candles.length - 2) continue;

        let sweepIdx = -1;
        for (let i = swHigh.index + 1; i < candles.length; i++) {
          const c = candles[i];
          if (c.high > swHigh.price && c.close < swHigh.price) {
            sweepIdx = i;
            break;
          }
        }

        if (sweepIdx !== -1) {
          details.liquiditySweep.sell = 'DETECTED';
          details.liquiditySweep.sellLevel = swHigh.price;
          details.liquiditySweep.sellTime = candles[sweepIdx].time;

          let dispIdx = -1;
          for (let i = sweepIdx; i < candles.length; i++) {
            const c = candles[i];
            const body = c.open - c.close;
            const range = c.high - c.low;
            if (body > 0 && range > 0 && body / range >= 0.45) {
              dispIdx = i;
              break;
            }
          }

          if (dispIdx !== -1) {
            details.displacement.sell = 'CONFIRMED';

            const priorLows = swingLows.filter(l => l.index >= swHigh.index - 5 && l.index <= dispIdx && l.price < swHigh.price);
            if (priorLows.length > 0) {
              const targetLow = priorLows[priorLows.length - 1];
              for (let i = dispIdx; i < candles.length; i++) {
                if (candles[i].close < targetLow.price) {
                  details.mss.sell = 'CONFIRMED';
                  details.mss.sellLevel = targetLow.price;
                  if (details.setupDirection === 'NONE') {
                    details.setupDirection = 'SELL';
                    details.setupReason = 'VALID SELL SETUP CONFIRMED (Sweep + Displacement + MSS)';
                  }
                  break;
                }
              }
            }
          }
          break;
        }
      }
    }

    return details;
  }
}
