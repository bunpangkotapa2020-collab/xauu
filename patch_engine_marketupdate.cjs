const fs = require('fs');
const file = 'src/engines/dara_m1/DaRaM1Engine.ts';
let code = fs.readFileSync(file, 'utf8');

const startMarker = `    const currentPrice = feed.bid; // Mid/Bid reference`;
const endMarker = `  /**\n   * Manages Profit Trailing on active position and detects Real Broker Position Closure.`;

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const newLogic = `    const currentPrice = feed.bid; // Mid/Bid reference
    const currentAsk = feed.ask;
    const currentBid = feed.bid;

    // Continuously update live analysis details for transparency
    if (feed.m1Candles && feed.m1Candles.length >= 10) {
      this.lastAnalysis = this.strategy.getAnalysisDetails(feed.m1Candles, this.userSettings, this.cachedPointSize || 0.01);
    }

    // 1. Manage Profit Trailing & Monitor Protection for all active positions
    for (const pos of this.stateMachine.getActivePositions()) {
      await this.manageActivePosition(pos, currentBid, currentAsk);
    }

    // If EA is STOPPED, stay idle
    if (!this.isRunning) {
      return;
    }

    const state = this.stateMachine.getState();
    const currentSetup = this.stateMachine.getSetup();

    // 2. State: SCANNING — Scan for Liquidity Sweep -> Displacement -> MSS
    if (state === 'SCANNING' && !this.stateMachine.hasOpenPositions()) {
      const initialSafety = this.evaluateSafety(feed.spreadPoints, feed.openTradesCount);
      if (!initialSafety.isSafeToTrade) {
        return;
      }

      if (!feed.m1Candles || feed.m1Candles.length < 10) {
        return;
      }

      const detectedSetup = this.strategy.scanForSetup(feed.m1Candles, this.userSettings, this.cachedPointSize);
      if (detectedSetup) {
        // Confirmed Signal!
        const sigPrice = detectedSetup.signalPrice ?? detectedSetup.lockedEntryPrice ?? (detectedSetup.direction === 'BUY' ? currentAsk : currentBid);
        detectedSetup.signalPrice = sigPrice;
        
        console.log(\`[DaRa M1 EA v1.0] 🎯 CONFIRMED SIGNAL: \${detectedSetup.direction} | Sweep=\${detectedSetup.sweepLevel} | MSS=\${detectedSetup.mssLevel} | Signal Price=\${sigPrice}\`);
        console.log(\`[DaRa M1 EA v1.0] ⏳ Waiting for price pullback... calculating 5 entry levels based on lockedEntryPrice.\`);
        
        this.stateMachine.onSetupDetected(detectedSetup);
      }
      return;
    }

    // 3. Check for Entry Levels if we have a setup
    if ((state === 'WAIT_FOR_LOCKED_ENTRY' || state === 'TRADE_ACTIVE') && currentSetup) {
      // Step A: Check Pending Setup Cancellation (Virtual TP or SL touched before any entry)
      if (!this.stateMachine.hasOpenPositions()) {
        const wasCanceled = this.stateMachine.checkPendingSetupCancellation(currentPrice);
        if (wasCanceled) {
          console.log(\`[DaRa M1 EA v1.0] 🚫 Pending Setup was Canceled (Virtual Target hit before Entry). Zero loss. Scanning for new setup.\`);
          if (this.telegram) {
            this.telegram.notify('🚫 DaRa M1 EA - SETUP CANCELLED', 'Price hit Virtual SL/TP before reaching Entry Target.\\nSetup discarded with Zero Loss. Resume Scanning.').catch(() => {});
          }
          return;
        }
      }

      // Step B: Check if Price hit the next Pending Level
      const nextLevel = this.stateMachine.getNextPendingLevel();
      const latestCandle = feed.m1Candles && feed.m1Candles.length > 0 ? feed.m1Candles[feed.m1Candles.length - 1] : undefined;
      
      if (nextLevel && this.stateMachine.isEntryPriceReached(currentPrice, latestCandle?.low, latestCandle?.high)) {
        const positionNumber = nextLevel.levelIndex + 1;
        
        // Safety verification immediately before sending broker order
        const safety = this.evaluateSafety(feed.spreadPoints, feed.openTradesCount);
        if (!safety.isSafeToTrade) {
          console.warn(\`[DaRa M1 EA v1.0] ⚠️ Entry hit but Safety Guard blocked execution: \${safety.blockedReason}\`);
          if (this.telegram) {
            this.telegram.notify('⚠️ DaRa M1 EA - ENTRY BLOCKED BY SAFETY GUARD', \`Reason: \${safety.blockedReason}\`).catch(() => {});
          }
          return; // Do not execute, but don't cancel setup either (can try again next tick)
        }

        if (state === 'WAIT_FOR_LOCKED_ENTRY') {
          this.stateMachine.onEntryTriggered();
        }

        console.log(\`[DaRa M1 EA v1.0] ⚡ Level \${positionNumber} Target reached (\${currentPrice} - target: \${nextLevel.targetPrice}). Executing Position #\${positionNumber} \${currentSetup.direction}...\`);
        if (this.telegram) {
          this.telegram.notify(\`⚡ DaRa M1 EA - POS #\${positionNumber} TARGET REACHED\`, \`Price reached Level \${positionNumber} target (\${currentPrice}).\\nExecuting Position #\${positionNumber} \${currentSetup.direction}...\`).catch(() => {});
        }

        const execResult = await this.execution.executeOrder(
          currentSetup,
          feed.symbol,
          currentAsk,
          currentBid,
          this.userSettings,
          nextLevel.levelIndex
        );

        if (execResult.success && execResult.position) {
          this.stateMachine.onPositionOpened(execResult.position, nextLevel.levelIndex);
          console.log(\`[DaRa M1 EA v1.0] 🚀 Position #\${positionNumber} Filled! Ticket #\${execResult.position.ticket}.\`);
          
          if (positionNumber === 5) {
             console.log(\`[DaRa M1 EA v1.0] 5/5 POSITIONS OPENED. 1 Confirmed Signal = 5 Positions MAX. STOPPING further entries.\`);
          }
        } else {
          console.error(\`[DaRa M1 EA v1.0] Execution rejected: \${execResult.error}\`);
          if (positionNumber === 1) {
             this.stateMachine.cancelSetup('EXPIRED', \`Execution error: \${execResult.error}\`);
          }
          if (this.telegram) {
            this.telegram.notify('🔴 DaRa M1 EA - ORDER REJECTED', \`Broker execution failed for Level \${positionNumber}:\\n\${execResult.error}\`).catch(() => {});
          }
        }
      }
    }
  }

`;

const newCode = code.substring(0, startIndex) + newLogic + code.substring(endIndex);
fs.writeFileSync(file, newCode);
