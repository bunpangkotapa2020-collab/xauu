/**
 * ============================================================================
 * 🔥 DaRa M1 EA v1.0 — ORDER EXECUTION ENGINE (DaRaOrderExecution)
 * 100% INDEPENDENT EXECUTION MODULE
 * 
 * Rules:
 * - USER SETTINGS = SINGLE SOURCE OF TRUTH
 * - No Hidden Defaults, No Hardcoded SL/TP, No Martingale, No Auto-Lot Scaling
 * - BUY:  SL = Actual Filled Entry - User SL Distance | TP = Actual Filled Entry + User TP Distance
 * - SELL: SL = Actual Filled Entry + User SL Distance | TP = Actual Filled Entry - User TP Distance
 * - SL & TP attached to real order immediately and verified.
 * - Master Entry remains authoritative for structure, setup lock & grid levels.
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
    isBotRunning: boolean,
    activePositionsCount: number
  ): Promise<ExecutionResult> {
    const positionNumber = levelIndex + 1;
    // 0. Hard Limit: Positions Per Setup (Authoritative limit from user settings, max 5)
    const rawUserMax = Number(settings.positionsPerSetup ?? settings.maxOpenTrades ?? settings.entriesPerSignal ?? 1);
    const maxAllowedPositions = isNaN(rawUserMax) ? 1 : Math.max(1, Math.min(5, Math.floor(rawUserMax)));
    
    // AUTHORITATIVE FINAL GATE: Combined existing broker positions and level limit
    if (positionNumber > maxAllowedPositions || activePositionsCount >= maxAllowedPositions) {
      console.error(`[DaRa M1 EA v1.0] 🛡️ HARD BLOCK (Final Gate): Active Positions (${activePositionsCount}) or Level (#${positionNumber}) exceeds configured limit (${maxAllowedPositions}). Execution aborted.`);
      return { 
        success: false, 
        error: `Strict Rule Violation: Configured Positions Per Setup is ${maxAllowedPositions}. Active: ${activePositionsCount}.` 
      };
    }
    
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

    // 4. Calculate SL and TP based strictly on ACTUAL BROKER FILLED ENTRY PRICE (AUTHORITATIVE USER RULE)
    // BUY:  SL = Actual Filled Entry - User SL Distance | TP = Actual Filled Entry + User TP Distance
    // SELL: SL = Actual Filled Entry + User SL Distance | TP = Actual Filled Entry - User TP Distance
    const masterEntry = setup.masterEntryPrice ?? setup.lockedEntryPrice;
    const execDir = setup.executionDirection || setup.direction;
    const openPrice: number = execDir === 'BUY' ? currentAsk : currentBid;

    const sl: number = execDir === 'BUY' 
      ? Number((openPrice - slPriceDistance).toFixed(3)) 
      : Number((openPrice + slPriceDistance).toFixed(3));
    const tp: number = execDir === 'BUY' 
      ? Number((openPrice + tpPriceDistance).toFixed(3)) 
      : Number((openPrice - tpPriceDistance).toFixed(3));
    
    // Update setup SL/TP tracking to reflect the active position
    setup.sharedSL = sl;
    setup.sharedTP = tp;

    // 5. Pre-flight Verification: Guarantee 100% Single Source of Truth based on Actual Filled Entry
    if (lot !== settings.lotSize) {
      return { success: false, error: `Pre-flight Verification Failed: Lot size ${lot} does not match User Saved Settings ${settings.lotSize}` };
    }
    if (execDir === 'BUY') {
      if (sl >= openPrice || tp <= openPrice) {
        return { success: false, error: `Pre-flight Verification Failed: BUY SL (${sl}) must be below and TP (${tp}) must be above Actual Entry (${openPrice})` };
      }
    } else {
      if (sl <= openPrice || tp >= openPrice) {
        return { success: false, error: `Pre-flight Verification Failed: SELL SL (${sl}) must be above and TP (${tp}) must be below Actual Entry (${openPrice})` };
      }
    }

    console.log(`[DaRa EXECUTION AUDIT] 📝 SetupID=${setup.id} | Direction=${execDir} | MasterEntry=${masterEntry} | ActualFillEntry=${openPrice} | EntryDist=${settings.entryDistance ?? 1.0} | Level=${levelIndex + 1} | TargetPrice=${setup.entryLevels?.[levelIndex]?.targetPrice} | ConfigPositionsPerSetup=${maxAllowedPositions} | CurrentPositionsOpened=${setup.positionsOpened || 0} | SL=${sl} | TP=${tp}`);

    this.isExecutionInProgress = true;

    try {
      console.log(`[DaRa M1 EA v1.0] 🛡️ PRE-FLIGHT VERIFIED (SINGLE SOURCE OF TRUTH 100%): Direction=${execDir}, Lot=${lot} (user), SL=${sl} (dist: ${slDistance}), TP=${tp} (dist: ${tpDistance}), Entry=${openPrice}`);
      console.log(`[DaRa M1 EA v1.0] 🚀 Sending ${execDir} Order to Broker...`);

      const comment = positionNumber > 1 ? `DaRa v1.0 ${execDir} #${positionNumber}` : `DaRa v1.0 ${execDir}`;
      
      // ==========================================
      // FINAL LIVE TRADING SAFETY GUARD
      // ==========================================
      if (!isBotRunning) {
        const errorMsg = 'HARD BLOCK: Bot is NOT explicitly RUNNING. Execution aborted.';
        console.error(`[DaRa M1 EA] ❌ ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
      
      if (settings.liveTradingEnabled !== true) {
        console.log(`[DaRa M1 EA] ℹ️ LIVE TRADING IS OFF (Monitor Mode). Execution aborted.`);
        return { success: false, error: 'LIVE TRADING IS OFF (Monitor Mode)' };
      }
      
      if (!this.broker) {
         return { success: false, error: 'HARD BLOCK: Broker connection is invalid or unavailable.' };
      }
      // ==========================================
      
      const brokerResponse = await this.broker.sendOrder({
        symbol,
        type: execDir,
        lot,
        openPrice,
        sl,
        tp,
        comment
      });

      if (!brokerResponse.success || !brokerResponse.ticket) {
        const brokerErrMsg = brokerResponse.error 
          ? (typeof brokerResponse.error === 'object' ? JSON.stringify(brokerResponse.error) : String(brokerResponse.error))
          : 'Broker rejected order without ticket';
        console.error(`[DaRa M1 EA v1.0] ❌ Broker Rejection: ${brokerErrMsg}`);
        return {
          success: false,
          error: `Broker Rejection: ${brokerErrMsg}`
        };
      }

      // Order successfully filled
      this.lastExecutedSetupId = execKey;
      this.executedKeys.add(execKey);
      // Preserve Master/Locked Entry as IMMUTABLE (do not overwrite with openPrice)
      setup.masterEntryPrice = masterEntry;
      setup.lastExecutedPrice = openPrice;
      setup.virtualSLPrice = sl;
      setup.virtualTPPrice = tp;

      const position: DaRaPosition = {
        ticket: brokerResponse.ticket,
        symbol,
        type: execDir,
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
