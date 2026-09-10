/**
 * ============================================================================
 * 🔥 DaRa M1 EA v1.0 — STATE MACHINE (DaRaM1StateMachine)
 * 100% INDEPENDENT M1 STATE CONTROLLER
 * 
 * Strict Sequence:
 * M1 MARKET -> SWEEP -> DISPLACEMENT -> MSS -> FULL SETUP READY -> LOCK ENTRY ->
 * WAIT FOR LOCKED ENTRY -> ENTRY REACHED -> EXECUTE -> TRADE ACTIVE ->
 * TRAILING -> CLOSED -> SCAN NEW SETUP
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
   * If a real position is active, it continues to be protected by broker SL/TP and trailing.
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
    setup.entryLevels = [];
    
    for (let i = 1; i <= 5; i++) {
      const step = (userSettings && userSettings.entryDistance !== undefined) ? userSettings.entryDistance : 1.0;
      const dist = i * step;
      let target = setup.direction === 'BUY' ? locked - dist : locked + dist;
      setup.entryLevels.push({
        targetPrice: Number(target.toFixed(3)),
        executed: false
      });
    }
    setup.positionsOpened = 0;

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

    if (setup.direction === 'BUY') {
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
    } else if (setup.direction === 'SELL') {
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

  public getNextPendingLevel(): { levelIndex: number; targetPrice: number } | null {
    if (!this.currentSetup || !this.currentSetup.entryLevels) return null;
    for (let i = 0; i < this.currentSetup.entryLevels.length; i++) {
      if (!this.currentSetup.entryLevels[i].executed) {
        return { levelIndex: i, targetPrice: this.currentSetup.entryLevels[i].targetPrice };
      }
    }
    return null;
  }

  public isEntryPriceReached(currentPrice: number, candleLow?: number, candleHigh?: number): boolean {
    if (!this.currentSetup || (this.currentState !== 'WAIT_FOR_LOCKED_ENTRY' && this.currentState !== 'MSS_CONFIRMED' && this.currentState !== 'TRADE_ACTIVE')) {
      return false;
    }
    const nextLevel = this.getNextPendingLevel();
    if (!nextLevel) return false;

    const setup = this.currentSetup;
    const target = nextLevel.targetPrice;

    if (setup.direction === 'BUY') {
      return currentPrice <= target || (candleLow !== undefined && candleLow <= target);
    }
    
    if (setup.direction === 'SELL') {
      return currentPrice >= target || (candleHigh !== undefined && candleHigh >= target);
    }
    return false;
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
    
    // Record TRADE_CLOSED in state history
    const exitDesc = closedTrade ? `${closedTrade.exitReason} (${closedTrade.pnl >= 0 ? '+' : ''}${closedTrade.pnl.toFixed(2)} P/L)` : 'Position Terminated';
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
    this.transitionTo('SETUP_CANCELED', details || `Setup canceled: ${reason}`);

    // Immediately return to SCANNING if engine is still active
    this.transitionTo('SCANNING', 'Setup cleared. Scanning for new M1 setup.');
  }

  public reset(): void {
    this.currentSetup = null;
    this.activePositions = [];
    this.lastClosedTrade = null;
    this.currentState = 'IDLE';
    this.stateHistory = [];
  }
}
