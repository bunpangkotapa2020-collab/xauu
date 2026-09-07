const fs = require('fs');
let code = fs.readFileSync('src/engines/dara_m1/DaRaM1Engine.ts', 'utf8');

// 1. Add additional tracking to DaRaM1Engine
if (!code.includes('private additionalEntryTriggered = new Set<string>();')) {
    code = code.replace(
        'private closedTicketsSet: Set<string> = new Set<string>();',
        'private closedTicketsSet: Set<string> = new Set<string>();\n  private additionalEntryTriggered = new Set<string>();\n  private additionalPosition: DaRaPosition | null = null;'
    );
}

// 2. Modify evaluateSafety to count both positions
code = code.replace(
    'const openTradesCount = this.stateMachine.getActivePosition() ? 1 : 0;',
    'const activePosCount = (this.stateMachine.getActivePosition() ? 1 : 0) + (this.additionalPosition ? 1 : 0);\n      const openTradesCount = activePosCount;'
);

// 3. In onMarketUpdate, evaluate additional entry
const onMarketUpdateTarget = `    // 1. If Position is Active: Manage Profit Trailing & Monitor Protection
    const activePos = this.stateMachine.getActivePosition();
    if (activePos) {
      await this.manageActivePosition(activePos, currentBid, currentAsk);
      return;
    }`;
const onMarketUpdateReplacement = `    // 1. If Position is Active: Manage Profit Trailing & Monitor Protection
    const activePos = this.stateMachine.getActivePosition();
    if (activePos) {
      await this.manageActivePosition(activePos, currentBid, currentAsk);

      // --- ADDITIONAL ENTRY LOGIC ---
      if (!this.additionalEntryTriggered.has(String(activePos.ticket)) && !this.additionalPosition) {
         const dist = this.userSettings.additionalEntryDistance || 4.0;
         let trigger = false;
         if (activePos.type === 'BUY' && currentAsk >= activePos.openPrice + dist) trigger = true;
         if (activePos.type === 'SELL' && currentBid <= activePos.openPrice - dist) trigger = true;
         
         if (trigger) {
            const activePosCount = (this.stateMachine.getActivePosition() ? 1 : 0) + (this.additionalPosition ? 1 : 0);
            const safety = this.evaluateSafety(feed.spreadPoints, activePosCount);
            if (safety.isSafeToTrade) {
               console.log(\`[DaRa M1 EA] ⚡ Additional Entry Triggered for \${activePos.type} at distance \${dist}\`);
               this.additionalEntryTriggered.add(String(activePos.ticket));
               
               // Calculate SL/TP using Raw Price Distance from new entry
               const sl = activePos.type === 'BUY' ? currentAsk - this.userSettings.slDistance : currentBid + this.userSettings.slDistance;
               const tp = activePos.type === 'BUY' ? currentAsk + this.userSettings.tpDistance : currentBid - this.userSettings.tpDistance;
               
               const dummySetup: any = { id: 'ADD_' + Date.now(), direction: activePos.type, lockedEntryPrice: activePos.type === 'BUY' ? currentAsk : currentBid, lockedSlTarget: sl, lockedTpTarget: tp, stage: 'LOCKED' };
               
               this.execution.executeOrder(dummySetup, feed.symbol, currentAsk, currentBid, this.userSettings).then(execResult => {
                   if (execResult.success && execResult.position) {
                       this.additionalPosition = execResult.position;
                       console.log(\`[DaRa M1 EA] 🚀 Additional Order Filled! Ticket #\${execResult.position.ticket}\`);
                   }
               });
            }
         }
      }

      if (this.additionalPosition) {
         await this.manageActivePosition(this.additionalPosition, currentBid, currentAsk);
      }
      return;
    }`;
code = code.replace(onMarketUpdateTarget, onMarketUpdateReplacement);

// 4. In handlePositionClosed, clear additionalPosition if matches
const handlePosClosedTarget = `    const activePos = this.stateMachine.getActivePosition();
    if (!activePos || String(activePos.ticket) !== ticketKey) {`;
const handlePosClosedReplacement = `    const activePos = this.stateMachine.getActivePosition();
    const isAdditional = this.additionalPosition && String(this.additionalPosition.ticket) === ticketKey;
    let targetPos = isAdditional ? this.additionalPosition : activePos;
    
    if (!targetPos || String(targetPos.ticket) !== ticketKey) {`;
code = code.replace(handlePosClosedTarget, handlePosClosedReplacement);

// Fix inner variable refs in handlePositionClosed (replace activePos with targetPos)
// Wait, the rest of the function uses activePos. We need to replace it.
// I'll just use a regex for the rest of handlePositionClosed.
// A better way is to do it manually. Let's output it and use string manipulation.
fs.writeFileSync('src/engines/dara_m1/DaRaM1Engine.ts.tmp', code);
