const fs = require('fs');
const file = 'src/engines/dara_m1/DaRaM1StateMachine.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace onSetupDetected
code = code.replace(/public onSetupDetected[\s\S]+?WAIT_FOR_LOCKED_ENTRY', `Waiting for Pos #1 target \(\$\{setup.pos1TargetPrice\}\)`\);\n  }/, `public onSetupDetected(setup: DaRaSetup): void {
    if (this.currentState !== 'SCANNING') return;
    this.currentSetup = setup;

    const locked = setup.lockedEntryPrice;
    setup.entryLevels = [];
    
    for (let i = 1; i <= 5; i++) {
      const dist = i * 1.0;
      let target = setup.direction === 'BUY' ? locked - dist : locked + dist;
      setup.entryLevels.push({
        targetPrice: Number(target.toFixed(3)),
        executed: false
      });
    }
    setup.positionsOpened = 0;

    const sigPrice = setup.signalPrice ?? setup.lockedEntryPrice;
    setup.signalPrice = sigPrice;
    
    this.transitionTo('MSS_CONFIRMED', \`MSS Confirmed: \${setup.direction} Setup Validated. Signal=\${sigPrice}\`);
    this.transitionTo('WAIT_FOR_LOCKED_ENTRY', \`Waiting for Pos #1 target (\${setup.entryLevels[0].targetPrice})\`);
  }`);

// Add getNextPendingLevel
const newMethods = `
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
`;

// Replace isEntryPriceReached and isPos2TargetReached
code = code.replace(/public isEntryPriceReached[\s\S]+?return false;\n  }/, newMethods);
code = code.replace(/public isPos2TargetReached[\s\S]+?return false;\n  }/, '');

fs.writeFileSync(file, code);
