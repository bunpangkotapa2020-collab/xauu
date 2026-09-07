const fs = require('fs');
const file = 'src/engines/dara_m1/DaRaM1StateMachine.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace onAdditionalPositionOpened through onPositionOpened
const posRegex = /public onAdditionalPositionOpened[\s\S]+?Broker confirmed position Ticket: \$\{position\.ticket\}`\);\n  }/;

const newPosLogic = `
  public onPositionOpened(position: DaRaPosition, levelIndex: number): void {
    this.activePositions.push(position);
    if (this.currentSetup && this.currentSetup.entryLevels) {
      this.currentSetup.status = 'EXECUTED';
      this.currentSetup.entryLevels[levelIndex].executed = true;
      this.currentSetup.entryLevels[levelIndex].ticket = position.ticket;
      this.currentSetup.positionsOpened = (this.currentSetup.positionsOpened || 0) + 1;
    }
    this.transitionTo('TRADE_ACTIVE', \`Broker confirmed position Ticket: \${position.ticket} (Level \${levelIndex + 1})\`);
  }

  public clearPosition(ticket: string | number): void {
    const ticketStr = String(ticket);
    this.activePositions = this.activePositions.filter(p => String(p.ticket) !== ticketStr);
    
    // If all positions are closed, go to TRADE_CLOSED
    if (this.activePositions.length === 0 && this.currentState === 'TRADE_ACTIVE') {
      this.onPositionClosed();
    }
  }

  public hasOpenPositions(): boolean {
    return this.activePositions.length > 0;
  }
`;

code = code.replace(posRegex, newPosLogic.trim());

// Modify onPositionClosed
code = code.replace(/this\.activePosition = null;\n    this\.additionalPosition = null;/, 'this.activePositions = [];');

// Modify reset
code = code.replace(/this\.activePosition = null;\n    this\.additionalPosition = null;/, 'this.activePositions = [];');

fs.writeFileSync(file, code);
