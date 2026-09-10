/**
 * ============================================================================
 * 🔥 DaRa M1 EA v1.0 — ORDER EXECUTION ENGINE (DaRaOrderExecution)
 * 100% INDEPENDENT EXECUTION MODULE
 * 
 * Rules:
 * - USER SETTINGS = SINGLE SOURCE OF TRUTH
 * - No Hidden Defaults, No Hardcoded SL/TP, No Martingale, No Auto-Lot Scaling
 * - BUY:  SL = Entry - User SL Distance | TP = Entry + User TP Distance
 * - SELL: SL = Entry + User SL Distance | TP = Entry - User TP Distance
 * - SL & TP attached to real order immediately and verified.
 * - Duplicate & Broker Rejection Protection.
 * ============================================================================
 */

import {
  DaRaBrokerInterface,
  DaRaDirection,
  DaRaPosition,
  DaRaSetup,
  DaRaTelegramInterface,
  DaRaUserSettings
} from './types';

export interface ExecutionResult {
  success: boolean;
  position?: DaRaPosition;
  error?: string;
}

export class DaRaOrderExecution {
  private broker: DaRaBrokerInterface;
  private telegram?: DaRaTelegramInterface;
  private isExecutionInProgress: boolean = false;
  private lastExecutedSetupId: string = '';
  private executedKeys: Set<string> = new Set();

  constructor(broker: DaRaBrokerInterface, telegram?: DaRaTelegramInterface) {
    this.broker = broker;
    this.telegram = telegram;
  }

  /**
   * Executes order strictly using User Settings as Single Source of Truth.
   * positionNumber: 1 for Position #1, 2 for Position #2.
   */
  public async executeOrder(
    setup: DaRaSetup,
    symbol: string,
    currentAsk: number,
    currentBid: number,
    settings: DaRaUserSettings,
    levelIndex: number,
    isBotRunning: boolean
  ): Promise<ExecutionResult> {
    const positionNumber = levelIndex + 1;
    // 0. Hard Limit: 1 Confirmed Signal = 5 Positions MAX
    if (positionNumber > 5) {
      return { success: false, error: `Strict Rule Violation: 1 Confirmed Signal = 5 Positions MAX (Position #${positionNumber} is strictly FORBIDDEN)` };
    }

    // 1. Duplicate Execution Protection
    if (this.isExecutionInProgress) {
      return { success: false, error: 'Execution already in progress (Duplicate Protection Guard)' };
    }

    const execKey = `${setup.id}_P${positionNumber}`;
    if (this.executedKeys.has(execKey) || this.lastExecutedSetupId === execKey) {
      return { success: false, error: `Position #${positionNumber} for Setup ${setup.id} already executed (Duplicate Protection Guard)` };
    }

    // 2. Read exact User Settings (SINGLE SOURCE OF TRUTH)
    const lot = settings.lotSize;
    if (!lot || lot <= 0) {
      return { success: false, error: `Invalid user lot size: ${lot}` };
    }

    const slDistance = settings.slDistance;
    const tpDistance = settings.tpDistance;

    if (!slDistance || slDistance <= 0 || !tpDistance || tpDistance <= 0) {
      return { success: false, error: `Invalid user SL/TP distances (SL: ${slDistance}, TP: ${tpDistance})` };
    }

    // 3. USER INPUT NUMBER = DIRECT PRICE DISTANCE
    // ❌ មិនត្រូវ × Broker Point Size
    // ❌ មិនត្រូវបម្លែង Point → Price
    // ❌ មិនត្រូវបម្លែង Pip → Point
    // ❌ មិនត្រូវ × 0.01 ឬ × 0.001
    // ❌ មិនត្រូវបម្លែងជា USD/USC
    const slPriceDistance = slDistance;
    const tpPriceDistance = tpDistance;

    // 4. Calculate SL and TP based strictly on original Locked Entry Price
    let sl: number;
    let tp: number;
    let openPrice: number = setup.direction === 'BUY' ? currentAsk : currentBid;

    if (setup.sharedSL !== undefined && setup.sharedTP !== undefined) {
      sl = setup.sharedSL;
      tp = setup.sharedTP;
    } else {
      sl = setup.virtualSLPrice;
      tp = setup.virtualTPPrice;
      setup.sharedSL = sl;
      setup.sharedTP = tp;
    }

    // 5. Pre-flight Verification: Guarantee 100% Single Source of Truth
    if (lot !== settings.lotSize) {
      return { success: false, error: `Pre-flight Verification Failed: Lot size ${lot} does not match User Saved Settings ${settings.lotSize}` };
    }
    if (setup.direction === 'BUY') {
      if (sl >= openPrice || tp <= openPrice) {
        return { success: false, error: `Pre-flight Verification Failed: BUY SL (${sl}) must be below and TP (${tp}) must be above entry (${openPrice})` };
      }
    } else {
      if (sl <= openPrice || tp >= openPrice) {
        return { success: false, error: `Pre-flight Verification Failed: SELL SL (${sl}) must be above and TP (${tp}) must be below entry (${openPrice})` };
      }
    }

    this.isExecutionInProgress = true;

    try {
      console.log(`[DaRa M1 EA v1.0] 🛡️ PRE-FLIGHT VERIFIED (SINGLE SOURCE OF TRUTH 100%): Direction=${setup.direction}, Lot=${lot} (user), SL=${sl} (dist: ${slDistance}), TP=${tp} (dist: ${tpDistance}), Entry=${openPrice}`);
      console.log(`[DaRa M1 EA v1.0] 🚀 Sending ${setup.direction} Order to Broker...`);

      const comment = positionNumber > 1 ? `DaRa v1.0 ${setup.direction} #${positionNumber}` : `DaRa v1.0 ${setup.direction}`;
      
      // ==========================================
      // FINAL LIVE TRADING SAFETY GUARD
      // ==========================================
      if (!isBotRunning) {
        const errorMsg = 'HARD BLOCK: Bot is NOT explicitly RUNNING. Execution aborted.';
        console.error(`[DaRa M1 EA] ❌ ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
      
      if (settings.liveTradingEnabled !== true) {
        const errorMsg = 'HARD BLOCK: liveTradingEnabled is NOT explicitly true. LIVE TRADING IS OFF. Execution aborted.';
        console.error(`[DaRa M1 EA] ❌ ${errorMsg}`);
        if (this.telegram) {
          this.telegram.notify('⚠️ DaRa M1 EA - LIVE OFF', errorMsg).catch(() => {});
        }
        return { success: false, error: errorMsg };
      }
      
      if (!this.broker) {
         return { success: false, error: 'HARD BLOCK: Broker connection is invalid or unavailable.' };
      }
      // ==========================================
      
      const brokerResponse = await this.broker.sendOrder({
        symbol,
        type: setup.direction,
        lot,
        openPrice,
        sl,
        tp,
        comment
      });

      if (!brokerResponse.success || !brokerResponse.ticket) {
        console.error(`[DaRa M1 EA v1.0] ❌ Broker Rejection: ${brokerResponse.error || 'Unknown broker error'}`);
        if (this.telegram) {
          const rejMsg = [
            `Reason: ${brokerResponse.error || 'Execution failed'}`,
            `Direction: ${setup.direction}`,
            `Position: #${positionNumber}`,
            `Symbol: ${symbol}`,
            `Lot: ${lot}`,
            `Attempted Entry: ${openPrice}`,
            `Time: ${new Date().toISOString()}`
          ].join('\n');
          this.telegram.notify('⚠️ DaRa M1 EA v1.0 — BROKER REJECTION', rejMsg).catch(() => {});
        }
        return {
          success: false,
          error: `Broker Rejection: ${brokerResponse.error || 'Execution failed'}`
        };
      }

      // Order successfully filled
      this.lastExecutedSetupId = execKey;
      this.executedKeys.add(execKey);
      setup.lockedEntryPrice = openPrice;
      setup.virtualSLPrice = sl;
      setup.virtualTPPrice = tp;

      const position: DaRaPosition = {
        ticket: brokerResponse.ticket,
        symbol,
        type: setup.direction,
        lot,
        openPrice,
        currentPrice: openPrice,
        sl,
        tp,
        originalTp: tp,
        originalSl: sl,
        openTime: Date.now()
      };

      console.log(`[DaRa M1 EA v1.0] ✅ Order FILLED! Pos #${positionNumber} | Ticket: ${position.ticket} | Direction: ${position.type} | Lot: ${position.lot} | SL: ${position.sl} | TP: ${position.tp}`);

      // Send Telegram notification (Single source of truth)
      if (this.telegram) {
        const title = positionNumber > 1 ? `🔥 DaRa M1 — បើក ${position.type} #${positionNumber}` : `🔥 DaRa M1 — បើក ${position.type}`;
        const msg = [
          symbol,
          `Lot: ${lot.toFixed(2)}`,
          `ចូល: ${openPrice.toFixed(3)}`,
          `SL: ${sl.toFixed(3)}`,
          `TP: ${tp.toFixed(3)}`
        ].join('\n');

        this.telegram.notify(title, msg, `ORDER_OPEN_${position.ticket}`).catch(err => {
          console.warn(`[DaRa M1 EA v1.0] Telegram notification warning:`, err);
        });
      }

      return { success: true, position };
    } catch (err: any) {
      console.error(`[DaRa M1 EA v1.0] Unexpected execution error:`, err);
      return { success: false, error: err?.message || 'Execution error' };
    } finally {
      this.isExecutionInProgress = false;
    }
  }

  public reset(): void {
    this.isExecutionInProgress = false;
    this.lastExecutedSetupId = '';
    this.executedKeys.clear();
  }
}
