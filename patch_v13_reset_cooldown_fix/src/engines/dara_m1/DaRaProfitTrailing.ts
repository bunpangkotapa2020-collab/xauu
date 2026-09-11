import { DaRaPosition, DaRaSetup, DaRaUserSettings } from './types';

export interface TrailingUpdateResult {
  shouldModify: boolean;
  newSl?: number;
  newTp?: number;
  reason?: string;
}

export interface TrailingEvaluationResult {
  activatedThisTick: boolean;
  shouldModifyBrokerSL: boolean;
  newHiddenSL?: number;
  newTp?: number;
  shouldCloseBasket: boolean;
  closeReason?: string;
  reason?: string;
}

export class DaRaProfitTrailing {
  public static readonly ACTIVATION_DISTANCE: number = 1.5;
  public static readonly TRAILING_DISTANCE: number = 1.5;

  /**
   * Evaluates Setup-level Basket Trailing according to DaRa M1 Specification:
   * - 1 Setup = ONE shared Trailing State
   * - Up to 5 Positions share the SAME Hidden Trailing SL
   * - Activation distance = 1.5 points from TP
   * - Activation happens ONLY ONCE per Setup
   * - Initial Hidden SL = TP ± 1.5
   * - Continuous Trailing = Current Price ± 1.5
   * - Never loosen the Hidden SL (Strict Monotonicity)
   * - Basket Close when Price reaches the last Hidden SL
   */
  public evaluateSetupTrailing(
    setup: DaRaSetup,
    activePositions: DaRaPosition[],
    currentBid: number,
    currentAsk: number,
    settings?: DaRaUserSettings
  ): TrailingEvaluationResult {
    if (settings && settings.trailingEnabled === false) {
      return { activatedThisTick: false, shouldModifyBrokerSL: false, shouldCloseBasket: false, reason: 'Trailing disabled in settings' };
    }

    if (!activePositions || activePositions.length === 0) {
      return { activatedThisTick: false, shouldModifyBrokerSL: false, shouldCloseBasket: false };
    }

    // Ensure shared trailing state exists on the Setup
    if (!setup.trailingState) {
      setup.trailingState = { activated: false };
    }

    const trailDistance = (settings && settings.trailingDistance !== undefined && settings.trailingDistance > 0)
      ? settings.trailingDistance
      : DaRaProfitTrailing.TRAILING_DISTANCE;

    const targetTp = setup.sharedTP || setup.virtualTPPrice || activePositions[0].tp || activePositions[0].originalTp || 0;
    if (targetTp <= 0) {
      return { activatedThisTick: false, shouldModifyBrokerSL: false, shouldCloseBasket: false, reason: 'No valid target TP' };
    }

    // ==========================================================
    // PHASE 1: TRAILING NOT YET ACTIVATED
    // ==========================================================
    if (!setup.trailingState.activated) {
      if (setup.direction === 'BUY') {
        const activationPrice = Number((targetTp - trailDistance).toFixed(3));
        if (currentBid >= activationPrice) {
          // ACTIVATE ONCE
          const hiddenSl = Number((activationPrice - trailDistance).toFixed(3));
          setup.trailingState.activated = true;
          setup.trailingState.activatedAt = Date.now();
          setup.trailingState.activationPrice = activationPrice;
          setup.trailingState.initialHiddenSL = hiddenSl;
          setup.trailingState.currentHiddenSL = hiddenSl;
          setup.trailingState.highestPrice = currentBid;

          for (const pos of activePositions) {
            pos.trailingActivated = true;
            pos.lastTrailingSl = hiddenSl;
          }

          return {
            activatedThisTick: true,
            shouldModifyBrokerSL: true,
            newHiddenSL: hiddenSl,
            newTp: 0, // Clear broker TP so trade continues trailing beyond original TP
            shouldCloseBasket: false,
            reason: `BUY Trailing Activated ONCE: Price ${currentBid} reached activation level ${activationPrice} (TP ${targetTp} - ${trailDistance}). Initial Hidden SL = ${hiddenSl}`
          };
        }
      } else { // SELL
        const activationPrice = Number((targetTp + trailDistance).toFixed(3));
        if (currentAsk <= activationPrice) {
          // ACTIVATE ONCE
          const hiddenSl = Number((activationPrice + trailDistance).toFixed(3));
          setup.trailingState.activated = true;
          setup.trailingState.activatedAt = Date.now();
          setup.trailingState.activationPrice = activationPrice;
          setup.trailingState.initialHiddenSL = hiddenSl;
          setup.trailingState.currentHiddenSL = hiddenSl;
          setup.trailingState.lowestPrice = currentAsk;

          for (const pos of activePositions) {
            pos.trailingActivated = true;
            pos.lastTrailingSl = hiddenSl;
          }

          return {
            activatedThisTick: true,
            shouldModifyBrokerSL: true,
            newHiddenSL: hiddenSl,
            newTp: 0, // Clear broker TP so trade continues trailing beyond original TP
            shouldCloseBasket: false,
            reason: `SELL Trailing Activated ONCE: Price ${currentAsk} reached activation level ${activationPrice} (TP ${targetTp} + ${trailDistance}). Initial Hidden SL = ${hiddenSl}`
          };
        }
      }

      // Before activation: Trailing = OFF, Profit Lock = OFF
      return { activatedThisTick: false, shouldModifyBrokerSL: false, shouldCloseBasket: false };
    }

    // ==========================================================
    // PHASE 2: TRAILING IS ACTIVE (CONTINUOUS TRAILING & BASKET CLOSE)
    // ==========================================================
    const currentHiddenSL = setup.trailingState.currentHiddenSL ?? setup.trailingState.initialHiddenSL ?? 0;

    if (setup.direction === 'BUY') {
      // 1. Check Basket Close: Price reversed and reached Hidden SL
      if (currentBid <= currentHiddenSL) {
        return {
          activatedThisTick: false,
          shouldModifyBrokerSL: false,
          shouldCloseBasket: true,
          closeReason: 'TRAILING_SL_HIT',
          reason: `BUY Basket Hit Trailing SL: Current Bid ${currentBid} touched/reversed past Hidden SL ${currentHiddenSL}`
        };
      }

      // 2. Continuous Trailing: Current Price - 1.5
      setup.trailingState.highestPrice = Math.max(setup.trailingState.highestPrice || currentBid, currentBid);
      const proposedSL = Number((currentBid - trailDistance).toFixed(3));

      // 3. Strict Monotonicity: Never loosen the Hidden SL (New >= Previous)
      if (proposedSL > currentHiddenSL) {
        setup.trailingState.currentHiddenSL = proposedSL;
        for (const pos of activePositions) {
          pos.lastTrailingSl = proposedSL;
        }

        return {
          activatedThisTick: false,
          shouldModifyBrokerSL: true,
          newHiddenSL: proposedSL,
          newTp: 0,
          shouldCloseBasket: false,
          reason: `BUY Hidden SL advanced to ${proposedSL} (Current Bid ${currentBid} - ${trailDistance})`
        };
      }

      return {
        activatedThisTick: false,
        shouldModifyBrokerSL: false,
        newHiddenSL: currentHiddenSL,
        shouldCloseBasket: false,
        reason: `BUY Hidden SL held at ${currentHiddenSL} (Proposed ${proposedSL} would loosen)`
      };

    } else { // SELL
      // 1. Check Basket Close: Price reversed and reached Hidden SL
      if (currentAsk >= currentHiddenSL) {
        return {
          activatedThisTick: false,
          shouldModifyBrokerSL: false,
          shouldCloseBasket: true,
          closeReason: 'TRAILING_SL_HIT',
          reason: `SELL Basket Hit Trailing SL: Current Ask ${currentAsk} touched/reversed past Hidden SL ${currentHiddenSL}`
        };
      }

      // 2. Continuous Trailing: Current Price + 1.5
      setup.trailingState.lowestPrice = Math.min(setup.trailingState.lowestPrice || currentAsk, currentAsk);
      const proposedSL = Number((currentAsk + trailDistance).toFixed(3));

      // 3. Strict Monotonicity: Never loosen the Hidden SL (New <= Previous)
      if (proposedSL < currentHiddenSL) {
        setup.trailingState.currentHiddenSL = proposedSL;
        for (const pos of activePositions) {
          pos.lastTrailingSl = proposedSL;
        }

        return {
          activatedThisTick: false,
          shouldModifyBrokerSL: true,
          newHiddenSL: proposedSL,
          newTp: 0,
          shouldCloseBasket: false,
          reason: `SELL Hidden SL advanced to ${proposedSL} (Current Ask ${currentAsk} + ${trailDistance})`
        };
      }

      return {
        activatedThisTick: false,
        shouldModifyBrokerSL: false,
        newHiddenSL: currentHiddenSL,
        shouldCloseBasket: false,
        reason: `SELL Hidden SL held at ${currentHiddenSL} (Proposed ${proposedSL} would loosen)`
      };
    }
  }

  /**
   * Compatibility wrapper for single position calculation
   */
  public calculateTrailingSL(
    position: DaRaPosition,
    currentBid: number,
    currentAsk: number,
    settings?: DaRaUserSettings,
    pointSize: number = 0.01
  ): TrailingUpdateResult {
    const trailDistance = (settings && settings.trailingDistance !== undefined && settings.trailingDistance > 0)
      ? settings.trailingDistance
      : DaRaProfitTrailing.TRAILING_DISTANCE;

    if (position.type === 'BUY') {
      const currentPrice = currentBid;
      position.highestPriceSinceOpen = Math.max(position.highestPriceSinceOpen || position.openPrice, currentPrice);
      const proposedSl = Number((position.highestPriceSinceOpen - trailDistance).toFixed(3));
      const currentSl = position.sl || 0;
      if (proposedSl > currentSl && proposedSl >= position.openPrice) {
        return {
          shouldModify: true,
          newSl: proposedSl,
          newTp: 0,
          reason: `BUY Trailing SL: ${proposedSl}`
        };
      }
    } else {
      const currentPrice = currentAsk;
      position.lowestPriceSinceOpen = Math.min(position.lowestPriceSinceOpen || position.openPrice, currentPrice);
      const proposedSl = Number((position.lowestPriceSinceOpen + trailDistance).toFixed(3));
      const currentSl = position.sl || 9999999;
      if (proposedSl < currentSl && proposedSl <= position.openPrice) {
        return {
          shouldModify: true,
          newSl: proposedSl,
          newTp: 0,
          reason: `SELL Trailing SL: ${proposedSl}`
        };
      }
    }
    return { shouldModify: false };
  }
}
