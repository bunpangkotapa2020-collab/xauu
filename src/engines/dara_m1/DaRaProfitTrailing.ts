/**
 * ============================================================================
 * 🔥 DaRa M1 EA v1.0 — PROFIT TRAILING ENGINE (DaRaProfitTrailing)
 * 100% INDEPENDENT TRAILING SL MODULE
 * 
 * Rules (Auto-Managed by EA):
 * - Activates when trade reaches Original TP.
 * - BUY TP = 100 -> Trailing SL starts at 98.5 (TP - 1.5).
 *   If price continues to rise -> SL trails upward behind price maintaining 1.5 distance.
 *   BUY SL NEVER moves downward.
 * - SELL TP = 100 -> Trailing SL starts at 101.5 (TP + 1.5).
 *   If price continues to fall -> SL trails downward behind price maintaining 1.5 distance.
 *   SELL SL NEVER moves upward.
 * - Trailing SL never set equal to TP.
 * - Trailing SL always at 1.5 distance from Price/TP to protect profit.
 * - Normal SL, TP, and Lot Size from Settings remain 100% untouched.
 * ============================================================================
 */

import { DaRaPosition, DaRaUserSettings } from './types';

export interface TrailingUpdateResult {
  shouldModify: boolean;
  newSl?: number;
  newTp?: number;
  reason?: string;
}

export class DaRaProfitTrailing {
  public static readonly TRAILING_DISTANCE: number = 1.5; // Fixed 1.5 Price Distance

  /**
   * Calculates the next trailing Stop Loss with strict monotonicity.
   * 
   * @param position Current active broker position
   * @param currentBid Current Bid price
   * @param currentAsk Current Ask price
   * @param settings User settings
   */
  public calculateTrailingSL(
    position: DaRaPosition,
    currentBid: number,
    currentAsk: number,
    settings?: DaRaUserSettings,
    pointSize: number = 0.01
  ): TrailingUpdateResult {
    if (settings && settings.trailingEnabled === false) {
      return { shouldModify: false, reason: 'Trailing disabled in settings' };
    }

    const originalTp = position.originalTp || position.tp;
    if (!originalTp || originalTp <= 0) {
      return { shouldModify: false, reason: 'No valid Original TP found on position' };
    }

    const trailDistance = (settings && settings.trailingDistance !== undefined && settings.trailingDistance > 0)
      ? settings.trailingDistance
      : DaRaProfitTrailing.TRAILING_DISTANCE; // 1.5 direct price distance

    if (position.type === 'BUY') {
      const currentPrice = currentBid;

      // 1. Activation check: Has price reached Original TP?
      if (!position.trailingActivated) {
        if (currentPrice >= originalTp) {
          position.trailingActivated = true;
          position.highestPriceSinceOpen = Math.max(originalTp, currentPrice);
        } else {
          return {
            shouldModify: false,
            reason: `BUY price (${currentPrice.toFixed(3)}) has not reached Original TP (${originalTp.toFixed(3)}) yet`
          };
        }
      }

      // Update highest peak price reached since TP activation
      position.highestPriceSinceOpen = Math.max(
        position.highestPriceSinceOpen || originalTp,
        currentPrice
      );

      // 2. Proposed new SL = Peak Price - 1.5
      // Example: TP = 100 -> SL = 98.5. Price at 101 -> SL = 99.5.
      const proposedSl = Number((position.highestPriceSinceOpen - trailDistance).toFixed(3));

      // 3. Strict Monotonicity & Profit Protection:
      // - BUY: SL moves UPWARD ONLY. Never moves down.
      // - SL only moves towards profit (proposedSl > position.openPrice).
      // - New SL must be strictly greater than current SL.
      const currentSl = position.sl || 0;
      if (proposedSl > currentSl && proposedSl > position.openPrice) {
        return {
          shouldModify: true,
          newSl: proposedSl,
          newTp: 0, // Clear broker TP so trade can continue trailing beyond TP
          reason: `BUY Trailing SL: TP reached (${originalTp}) -> SL advanced to ${proposedSl} (1.5 distance from peak ${position.highestPriceSinceOpen})`
        };
      } else {
        return {
          shouldModify: false,
          reason: `BUY proposed SL (${proposedSl.toFixed(3)}) <= current SL (${currentSl.toFixed(3)}). Monotonicity preserved.`
        };
      }
    } else if (position.type === 'SELL') {
      const currentPrice = currentAsk;

      // 1. Activation check: Has price reached Original TP?
      if (!position.trailingActivated) {
        if (currentPrice <= originalTp) {
          position.trailingActivated = true;
          position.lowestPriceSinceOpen = Math.min(originalTp, currentPrice);
        } else {
          return {
            shouldModify: false,
            reason: `SELL price (${currentPrice.toFixed(3)}) has not reached Original TP (${originalTp.toFixed(3)}) yet`
          };
        }
      }

      // Update lowest trough price reached since TP activation
      position.lowestPriceSinceOpen = Math.min(
        position.lowestPriceSinceOpen || originalTp,
        currentPrice
      );

      // 2. Proposed new SL = Trough Price + 1.5
      // Example: TP = 100 -> SL = 101.5. Price at 99 -> SL = 100.5.
      const proposedSl = Number((position.lowestPriceSinceOpen + trailDistance).toFixed(3));

      // 3. Strict Monotonicity & Profit Protection:
      // - SELL: SL moves DOWNWARD ONLY. Never moves up.
      // - SL only moves towards profit (proposedSl < position.openPrice).
      // - New SL must be strictly lower than current SL.
      const currentSl = position.sl || 9999999;
      if (proposedSl < currentSl && proposedSl < position.openPrice) {
        return {
          shouldModify: true,
          newSl: proposedSl,
          newTp: 0, // Clear broker TP so trade can continue trailing beyond TP
          reason: `SELL Trailing SL: TP reached (${originalTp}) -> SL advanced to ${proposedSl} (1.5 distance from trough ${position.lowestPriceSinceOpen})`
        };
      } else {
        return {
          shouldModify: false,
          reason: `SELL proposed SL (${proposedSl.toFixed(3)}) >= current SL (${currentSl.toFixed(3)}). Monotonicity preserved.`
        };
      }
    }

    return { shouldModify: false };
  }
}

