/**
 * ============================================================================
 * 🔥 DaRa M1 EA v1.0 — STATE MACHINE (DaRaM1StateMachine)
 * 100% INDEPENDENT M1 STATE CONTROLLER
 * 
 * Strict Sequence:
 * M1 MARKET -> SWEEP -> DISPLACEMENT -> MSS -> FULL SETUP READY -> LOCK ENTRY ->
 * WAIT FOR LOCKED ENTRY -> ENTRY REACHED -> EXECUTE -> TRADE ACTIVE ->
 * CLOSED -> SCAN NEW SETUP
 * 
 * Pending Setup Cancellation:
 * If Price reaches Virtual TP or Virtual SL before Entry:
 * -> CANCEL SETUP -> CLEAR SETUP -> SCAN NEW SETUP (Zero Loss, Zero Cooldown)
 * ============================================================================
 */

import { DaRaState, DaRaSetup, DaRaPosition, DaRaClosedTrade } from './types';

export interface StateChangeEvent {
  previousState: DaRaState;
  newState: DaRaState;
  timestamp: number;
  reason?: string;
  setupId?: string;
}

export class DaRaM1StateMachine {
  private currentState: DaRaState = 'IDLE';
  private currentSetup: DaRaSetup | null = null;
  private activePositions: DaRaPosition[] = [];
  private lastClosedTrade: DaRaClosedTrade | null = null;
  private stateHistory: StateChangeEvent[] = [];
  private lastEvaluatedPrice?: number;
  private consecutiveEmptyPolls: number = 0;
  private lastValidPositionsTimestamp: number = Date.now();

  constructor() {
    this.transitionTo('IDLE', 'Engine initialized');
  }

  public getState(): DaRaState {
    return this.currentState;
  }

  public getSetup(): DaRaSetup | null {
    return this.currentSetup;
  }

  

  public getActivePositions(): DaRaPosition[] {
    return this.activePositions;
  }

  public getActivePosition(): DaRaPosition | null {
    return this.activePositions.length > 0 ? this.activePositions[0] : null;
  }

  public getLastClosedTrade(): DaRaClosedTrade | null {
    return this.lastClosedTrade;
  }

  public getHistory(): StateChangeEvent[] {
    return [...this.stateHistory];
  }

  /**
   * Synchronizes active positions from an external source (Broker/MT5).
   * Used during startup or recovery to ensure the state machine matches reality.
   */
  public syncPositions(positions: DaRaPosition[], settings: import('./types').DaRaUserSettings, isMt5Connected: boolean = true): void {
    const now = Date.now();
    
    if (positions.length === 0) {
      this.consecutiveEmptyPolls++;
      
      // RULE 2: EMPTY POSITION RESPONSE PROTECTION
      // If we have local positions but receive [] from broker:
      if (this.activePositions.length > 0) {
        const timeSinceLastValid = now - this.lastValidPositionsTimestamp;
        
        // If connection is unstable or we haven't reached a "confirmed" closure state, preserve local state.
        // We only clear if:
        // 1. We are connected AND have received multiple consecutive empty polls (e.g. 5 polls ~ 15-20s)
        // 2. OR if we have an explicit confirmation from history (handled in Engine level usually, but here we guard)
        const EMPTY_POLL_THRESHOLD = 5; 
        
        if (!isMt5Connected || this.consecutiveEmptyPolls < EMPTY_POLL_THRESHOLD) {
          if (this.consecutiveEmptyPolls === 1) {
             console.log(`[DaRa StateMachine] ⚠️ Received [] from Broker but local state has ${this.activePositions.length} positions. Guarding against transient API error...`);
          }
          return; // KEEP local state for now
        }
        
        console.log(`[DaRa StateMachine] 🛑 Confirmed: All positions closed at Broker after ${this.consecutiveEmptyPolls} empty polls. Clearing local state.`);
        this.activePositions = [];
        this.currentSetup = null; // Also clear setup when positions are gone
        this.consecutiveEmptyPolls = 0;
        if (this.currentState === 'TRADE_ACTIVE') {
          this.transitionTo('SCANNING', 'BROKER POSITION SYNC: Positions confirmed closed in Broker. Resuming SCANNING.');
        }
      } else {
        // No local positions, no broker positions -> normal scanning
        this.consecutiveEmptyPolls = 0;
        this.lastValidPositionsTimestamp = now;
      }
      return;
    }

    // Genuinely received positions
    this.consecutiveEmptyPolls = 0;
    this.lastValidPositionsTimestamp = now;

    // DaRa M1 Rule: 1 Setup = 1 Direction.
    const direction = positions[0].type;
    const hasMismatch = positions.some(p => p.type !== direction);

    if (hasMismatch) {
      console.warn(`[DaRa StateMachine] ⚠️ BROKER POSITION SYNC: Mismatched directions detected (BUY/SELL mix). Recovery failed.`);
      this.activePositions = [...positions];
      if (this.currentState !== 'TRADE_ACTIVE') {
        this.transitionTo('TRADE_ACTIVE', 'BROKER POSITION SYNC: Mismatched positions detected. Blocking new entries.');
      }
      return;
    }

    // Reconstruct Setup if missing or direction changed
    if (!this.currentSetup || this.currentSetup.direction !== direction) {
      console.log(`[DaRa StateMachine] 🔄 BROKER POSITION SYNC: Recovering ${direction} state from ${positions.length} active position(s).`);
      
      const firstPos = positions[0];
      const masterPrice = firstPos.openPrice;
      
      // If we are recovering without a persisted setup, we use RECOVERED prefix
      const isNewRecovery = !this.currentSetup || this.currentSetup.direction !== direction;

      if (isNewRecovery) {
        this.currentSetup = {
          id: `RECOVERED_${direction}_${Date.now()}`,
          direction: direction,
          lockedEntryPrice: masterPrice,
          masterEntryPrice: masterPrice,
          sweepLevel: masterPrice, // Recovery default
          sweepTime: Date.now(),    // Recovery default
          displacementConfirmed: true,
          mssLevel: masterPrice,    // Recovery default
          mssTime: Date.now(),       // Recovery default
          status: 'EXECUTED',
          createdAt: firstPos.openTime,
          virtualSLPrice: firstPos.sl,
          virtualTPPrice: firstPos.tp,
          userSlDistance: settings.slDistance,
          userTpDistance: settings.tpDistance,
          positionsOpened: positions.length,
          lastExecutedPrice: masterPrice,
          lastExecutedLevel: positions.length - 1,
          entryLevels: [],
          isRecovered: true
        };

        // Reconstruct grid step if possible
        const step = settings.entryDistance ?? 0.5;
        for (let i = 0; i < 5; i++) {
          const dist = (i + 1) * step;
          const target = direction === 'SELL' ? masterPrice + dist : masterPrice - dist;
          this.currentSetup.entryLevels!.push({
            targetPrice: Number((target || 0).toFixed(3)),
            executed: i < positions.length,
            ticket: i < positions.length ? positions[i].ticket : undefined
          });
        }
      }
    } else {
      // Setup exists (either from persistence or previous tick), just update executed flags and tickets
      if (this.currentSetup.entryLevels) {
        for (let i = 0; i < 5; i++) {
          if (i < positions.length) {
            this.currentSetup.entryLevels[i].executed = true;
            this.currentSetup.entryLevels[i].ticket = positions[i].ticket;
          }
        }
        this.currentSetup.positionsOpened = positions.length;
        // Also ensure shared SL/TP are synced if they were modified at broker (though EA usually owns them)
        this.currentSetup.sharedSL = positions[0].sl;
        this.currentSetup.sharedTP = positions[0].tp;
      }
    }

    this.activePositions = [...positions.map(p => ({ ...p, isRecovered: this.currentSetup?.isRecovered }))];
    if (this.currentState !== 'TRADE_ACTIVE' && this.currentState !== 'EXECUTING') {
      this.transitionTo('TRADE_ACTIVE', `BROKER POSITION SYNC COMPLETE: ${positions.length} ACTIVE POSITION RECOVERED.`);
    }
  }

  public transitionTo(newState: DaRaState, reason?: string): void {
    const previousState = this.currentState;
    this.currentState = newState;

    const event: StateChangeEvent = {
      previousState,
      newState,
      timestamp: Date.now(),
      reason,
      setupId: this.currentSetup?.id
    };

    this.stateHistory.push(event);
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
  }

  /**
   * Called when user presses START.
   * Begins 24/7 scanning for M1 setups.
   */
  public onUserStart(): void {
    if (this.currentState === 'IDLE' || this.currentState === 'SETUP_CANCELED') {
      this.transitionTo('SCANNING', 'User initiated START — 24/7 M1 market scanning active');
    }
  }

  /**
   * Called when user presses STOP.
   * If a real position is active, it continues to be protected by broker SL/TP.
   * Only new entries and pending setups are stopped.
   */
  public onUserStop(): void {
    if (this.currentSetup && this.currentState === 'WAIT_FOR_LOCKED_ENTRY') {
      this.currentSetup.status = 'CANCELED';
      this.currentSetup.cancellationReason = 'USER_STOP';
      this.currentSetup = null;
    }

    if (this.currentState !== 'TRADE_ACTIVE') {
      this.transitionTo('IDLE', 'User initiated STOP — New setups and entries paused');
    }
  }

  /**
   * Locks in a new valid setup from Strategy (MSS Confirmed).
   */
  public onSetupDetected(setup: DaRaSetup, userSettings?: import('./types').DaRaUserSettings): void {
    if (this.currentState !== 'SCANNING') return;
    this.currentSetup = setup;

    const locked = setup.lockedEntryPrice;
    setup.masterEntryPrice = locked;
    setup.entryLevels = [];
    
    // Unified Step: L(i) = Master ± (i+1) * Step
    const step = (userSettings && userSettings.entryDistance !== undefined) ? userSettings.entryDistance : 0.5;
    const execDir = setup.executionDirection || setup.direction;

    for (let i = 0; i < 5; i++) {
      const dist = (i + 1) * step;
      const target = execDir === 'SELL' ? locked + dist : locked - dist;
      setup.entryLevels.push({
        targetPrice: Number((target || 0).toFixed(3)),
        executed: false
      });
    }
    setup.positionsOpened = 0;
    setup.lastExecutedPrice = undefined;
    setup.lastExecutedLevel = undefined;
    this.lastEvaluatedPrice = undefined;

    const sigPrice = setup.signalPrice ?? setup.lockedEntryPrice;
    setup.signalPrice = sigPrice;
    
    this.transitionTo('MSS_CONFIRMED', `MSS Confirmed: ${setup.direction} Setup Validated. Signal=${sigPrice}`);
    this.transitionTo('WAIT_FOR_LOCKED_ENTRY', `Waiting for Pos #1 target (${setup.entryLevels[0].targetPrice})`);
  }

  /**
   * Transitions from MSS_CONFIRMED to EXECUTING after Safety Verification.
   */
  public onExecuting(reason?: string): void {
    this.transitionTo('EXECUTING', reason || 'Executing order at Market Price immediately following MSS Confirmed and Safety Check');
  }

  /**
   * Returns state back to SCANNING if safety guards or broker rejected execution.
   */
  public resetToScanning(reason?: string): void {
    this.currentSetup = null;
    this.transitionTo('SCANNING', reason || 'Resuming scanning');
  }

  /**
   * Pending Setup Cancellation Checker:
   * BUY:
   *   - Price >= Virtual TP before entry -> CANCEL SETUP
   *   - Price <= Virtual SL before entry -> CANCEL SETUP
   * SELL:
   *   - Price <= Virtual TP before entry -> CANCEL SETUP
   *   - Price >= Virtual SL before entry -> CANCEL SETUP
   * 
   * Returns true if setup was canceled.
   */
  public checkPendingSetupCancellation(currentPrice: number): boolean {
    if (!this.currentSetup || (this.currentState !== 'WAIT_FOR_LOCKED_ENTRY' && this.currentState !== 'MSS_CONFIRMED')) {
      return false;
    }

    const setup = this.currentSetup;
    const execDir = setup.executionDirection || setup.direction;

    if (execDir === 'BUY') {
      // Reached Virtual TP first
      if (currentPrice >= setup.virtualTPPrice) {
        this.cancelSetup('VIRTUAL_TP_REACHED', `BUY Virtual TP (${setup.virtualTPPrice}) reached before entry. Setup invalidated.`);
        return true;
      }
      // Reached Virtual SL first
      if (currentPrice <= setup.virtualSLPrice) {
        this.cancelSetup('VIRTUAL_SL_REACHED', `BUY Virtual SL (${setup.virtualSLPrice}) reached before entry. Setup invalidated.`);
        return true;
      }
    } else if (execDir === 'SELL') {
      // Reached Virtual TP first
      if (currentPrice <= setup.virtualTPPrice) {
        this.cancelSetup('VIRTUAL_TP_REACHED', `SELL Virtual TP (${setup.virtualTPPrice}) reached before entry. Setup invalidated.`);
        return true;
      }
      // Reached Virtual SL first
      if (currentPrice >= setup.virtualSLPrice) {
        this.cancelSetup('VIRTUAL_SL_REACHED', `SELL Virtual SL (${setup.virtualSLPrice}) reached before entry. Setup invalidated.`);
        return true;
      }
    }
    return false;
  }

  public getNextPendingLevel(maxAllowedPositions: number = 1): { levelIndex: number; targetPrice: number } | null {
    if (!this.currentSetup || !this.currentSetup.entryLevels) return null;
    const rawLimit = Number(maxAllowedPositions);
    const limit = isNaN(rawLimit) ? 1 : Math.max(1, Math.min(5, Math.floor(rawLimit)));

    // Stop if we have already opened the maximum allowed positions for this setup
    if ((this.currentSetup.positionsOpened || 0) >= limit) {
      return null;
    }

    for (let i = 0; i < Math.min(this.currentSetup.entryLevels.length, limit); i++) {
      if (!this.currentSetup.entryLevels[i].executed) {
        return { levelIndex: i, targetPrice: this.currentSetup.entryLevels[i].targetPrice };
      }
    }
    return null;
  }

  public isEntryPriceReached(
    currentPrice: number,
    maxAllowedPositions: number = 5,
    prevPrice?: number,
    entryDistance?: number
  ): boolean {
    if (!this.currentSetup || (this.currentState !== 'WAIT_FOR_LOCKED_ENTRY' && this.currentState !== 'MSS_CONFIRMED' && this.currentState !== 'TRADE_ACTIVE')) {
      return false;
    }
    const nextLevel = this.getNextPendingLevel(maxAllowedPositions);
    if (!nextLevel) return false;

    const setup = this.currentSetup;
    const target = nextLevel.targetPrice;
    const levelIndex = nextLevel.levelIndex;
    const execDir = setup.executionDirection || setup.direction;

    const effectivePrevPrice = prevPrice !== undefined ? prevPrice : this.lastEvaluatedPrice;

    // 1. Initial Entry (Level 1, index 0):
    // Directly checks if current market price reached locked entry price
    if (levelIndex === 0) {
      let isReached = false;
      if (execDir === 'BUY') {
        isReached = currentPrice <= target;
      } else {
        isReached = currentPrice >= target;
      }
      this.lastEvaluatedPrice = currentPrice;
      return isReached;
    }

    // 2. Subsequent Levels (Level 2..5, index 1..4):
    // Requires a VALID NEW PRICE EVENT.

    // Rejection Rule A: Price is identical to the fill price of the previous level
    // (Sitting stationary at the fill price of the prior level cannot trigger another level)
    // EXCEPTION: If the NEXT target price is also identical to the last fill price, allow it.
    if (setup.lastExecutedPrice !== undefined && currentPrice === setup.lastExecutedPrice && target !== setup.lastExecutedPrice) {
      this.lastEvaluatedPrice = currentPrice;
      return false;
    }

    // Rejection Rule B: Repeated identical tick with no price movement
    // EXCEPTION: If the current price IS the target price, allow evaluation to proceed.
    if (effectivePrevPrice !== undefined && currentPrice === effectivePrevPrice && currentPrice !== target) {
      return false;
    }

    // Determine entry distance step: argument, or difference between levels 2 and 1, or default 1.0
    let step = 1.0;
    if (entryDistance !== undefined && entryDistance > 0) {
      step = entryDistance;
    } else if (setup.entryLevels && setup.entryLevels.length >= 3) {
      const detected = Math.abs((setup.entryLevels[2]?.targetPrice || 0) - (setup.entryLevels[1]?.targetPrice || 0));
      if (detected > 0) step = Number((detected || 0).toFixed(3));
    } else if (setup.entryLevels && setup.entryLevels.length >= 2) {
      const detected = Math.abs((setup.entryLevels[1]?.targetPrice || 0) - (setup.entryLevels[0]?.targetPrice || 0));
      if (detected > 0) step = Number((detected || 0).toFixed(3));
    }

    const lastExecPrice = setup.lastExecutedPrice;
    let isReached = false;

    if (execDir === 'BUY') {
      // Must be at or below target price
      if (currentPrice <= target) {
        if (lastExecPrice === undefined || lastExecPrice > target || lastExecPrice === target) {
          // Normal case: previous level executed above target (e.g. L1 at 100, L2 target 99)
          // Or level 2+ shares the same target price as level 1 fill
          isReached = true;
        } else {
          // Deep price spike/overshoot barrier (lastExecPrice <= target):
          // e.g. L2 executed at 96, L3 target is 98.
          // Requires either:
          // Pathway 1: Re-crossing target from above (price rebounded > target, then crossed <= target)
          // Pathway 2: Continuation lower by at least entry distance (currentPrice <= lastExecPrice - step)
          const hasCrossedDown = effectivePrevPrice !== undefined && effectivePrevPrice > target && currentPrice <= target;
          const hasContinuedLower = currentPrice <= Number(((lastExecPrice || 0) - (step || 0)).toFixed(3));
          isReached = hasCrossedDown || hasContinuedLower;
        }
      }
    } else if (execDir === 'SELL') {
      // Must be at or above target price
      if (currentPrice >= target) {
        if (lastExecPrice === undefined || lastExecPrice < target || lastExecPrice === target) {
          // Normal case: previous level executed below target (e.g. L1 at 100, L2 target 101)
          // Or level 2+ shares the same target price as level 1 fill
          isReached = true;
        } else {
          // Deep price spike/overshoot barrier (lastExecPrice >= target):
          // e.g. L2 executed at 104, L3 target is 102.
          // Requires either:
          // Pathway 1: Re-crossing target from below (price pulled back < target, then crossed >= target)
          // Pathway 2: Continuation higher by at least entry distance (currentPrice >= lastExecPrice + step)
          const hasCrossedUp = effectivePrevPrice !== undefined && effectivePrevPrice < target && currentPrice >= target;
          const hasContinuedHigher = currentPrice >= Number(((lastExecPrice || 0) + (step || 0)).toFixed(3));
          isReached = hasCrossedUp || hasContinuedHigher;
        }
      }
    }

    this.lastEvaluatedPrice = currentPrice;
    return isReached;
  }

  /**
   * Transitions from WAIT_FOR_LOCKED_ENTRY to EXECUTING.
   */
  public onEntryTriggered(): void {
    if (this.currentState === 'WAIT_FOR_LOCKED_ENTRY') {
      this.transitionTo('EXECUTING', 'Price touched locked entry price. Executing order.');
    }
  }

  /**
   * Broker confirmed position opened with ticket.
   */
  public onPositionOpened(position: DaRaPosition, levelIndex: number): void {
    this.activePositions.push(position);
    if (this.currentSetup && this.currentSetup.entryLevels) {
      this.currentSetup.status = 'EXECUTED';
      this.currentSetup.entryLevels[levelIndex].executed = true;
      this.currentSetup.entryLevels[levelIndex].ticket = position.ticket;
      this.currentSetup.positionsOpened = (this.currentSetup.positionsOpened || 0) + 1;
      this.currentSetup.lastExecutedPrice = position.openPrice ?? this.currentSetup.entryLevels[levelIndex].targetPrice;
      this.currentSetup.lastExecutedLevel = levelIndex;
      this.lastEvaluatedPrice = this.currentSetup.lastExecutedPrice;
    }
    this.transitionTo('TRADE_ACTIVE', `Broker confirmed position Ticket: ${position.ticket} (Level ${levelIndex + 1})`);
  }

  public clearPosition(ticket: string | number): void {
    const ticketStr = String(ticket);
    this.activePositions = this.activePositions.filter(p => String(p.ticket) !== ticketStr);
  }

  public hasOpenPositions(): boolean {
    return this.activePositions.length > 0;
  }

  /**
   * Broker position closed.
   */
  public onPositionClosed(closedTrade?: DaRaClosedTrade): void {
    if (closedTrade) {
      this.lastClosedTrade = closedTrade;
    }
    this.activePositions = [];
    this.currentSetup = null;
    this.lastEvaluatedPrice = undefined;
    
    // Record TRADE_CLOSED in state history
    const exitDesc = closedTrade ? `${closedTrade.exitReason} (${(closedTrade.pnl || 0) >= 0 ? '+' : ''}${(closedTrade.pnl || 0).toFixed(2)} P/L)` : 'Position Terminated';
    this.transitionTo('TRADE_CLOSED', `Trade #${closedTrade?.ticket || 'LIVE'} closed by Broker: ${exitDesc}`);

    // Seamlessly transition back to SCANNING 24/7
    this.transitionTo('SCANNING', 'Trade closed. Resuming 24/7 M1 market scanning for next setup.');
  }

  /**
   * Resume scanning if currently in TRADE_CLOSED state.
   */
  public resumeScanningAfterClose(): void {
    if (this.currentState === 'TRADE_CLOSED') {
      this.transitionTo('SCANNING', 'Resuming 24/7 M1 market scanning for next setup.');
    }
  }

  /**
   * Cancels the pending setup cleanly without treating it as a loss or win.
   */
  public cancelSetup(reason: 'VIRTUAL_TP_REACHED' | 'VIRTUAL_SL_REACHED' | 'EXPIRED' | 'USER_STOP', details?: string): void {
    if (this.currentSetup) {
      this.currentSetup.status = 'CANCELED';
      this.currentSetup.cancellationReason = reason;
    }

    this.currentSetup = null;
    this.lastEvaluatedPrice = undefined;
    this.transitionTo('SETUP_CANCELED', details || `Setup canceled: ${reason}`);

    // Immediately return to SCANNING if engine is still active
    this.transitionTo('SCANNING', 'Setup cleared. Scanning for new M1 setup.');
  }

  public reset(): void {
    this.currentSetup = null;
    this.activePositions = [];
    this.lastClosedTrade = null;
    this.lastEvaluatedPrice = undefined;
    this.consecutiveEmptyPolls = 0;
    this.currentState = 'IDLE';
    this.stateHistory = [];
  }

  /**
   * Serializes current state for persistence.
   */
  public serialize(): any {
    return {
      currentState: this.currentState,
      currentSetup: this.currentSetup,
      activePositions: this.activePositions,
      lastClosedTrade: this.lastClosedTrade,
      lastEvaluatedPrice: this.lastEvaluatedPrice
    };
  }

  /**
   * Deserializes state from persisted data.
   */
  public deserialize(data: any): void {
    if (!data) return;
    
    if (data.currentState) this.currentState = data.currentState;
    if (data.currentSetup) this.currentSetup = data.currentSetup;
    if (data.activePositions) this.activePositions = data.activePositions;
    if (data.lastClosedTrade) this.lastClosedTrade = data.lastClosedTrade;
    if (data.lastEvaluatedPrice) this.lastEvaluatedPrice = data.lastEvaluatedPrice;
    
    console.log(`[DaRa StateMachine] 💾 State deserialized. Current State: ${this.currentState}, Setup: ${this.currentSetup?.id || 'NONE'}`);
  }
}
