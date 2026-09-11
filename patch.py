import re

with open("src/engines/dara_m1/DaRaM1Engine.ts", "r") as f:
    content = f.read()

target = """    if (activePositions.length > 0 && setupForTrailing) {
      const trailingResult = this.trailing.evaluateSetupTrailing("""

replacement = """    if (activePositions.length > 0 && setupForTrailing) {
      // 1.a. Manage +50 USC Basket Profit Lock
      let basketNetProfit = 0;
      for (const pos of activePositions) {
        const priceDiff = pos.type === 'BUY' ? (currentBid - pos.openPrice) : (pos.openPrice - currentAsk);
        basketNetProfit += (priceDiff * pos.lot * 100);
      }
      basketNetProfit = Number(basketNetProfit.toFixed(2));

      if (!setupForTrailing.trailingState) {
        setupForTrailing.trailingState = { activated: false };
      }

      const PROFIT_LOCK_THRESHOLD = 50; // +50 USC

      if (!setupForTrailing.trailingState.profitLockActivated && basketNetProfit >= PROFIT_LOCK_THRESHOLD) {
        setupForTrailing.trailingState.profitLockActivated = true;
        console.log(`[DaRa M1 EA v1.0] 🔒 BASKET PROFIT LOCK ACTIVATED at +${basketNetProfit.toFixed(2)} USC (Threshold: +${PROFIT_LOCK_THRESHOLD} USC)`);
        if (this.telegram) {
          const title = `🔒 DaRa M1 - PROFIT LOCK ACTIVATED`;
          const msg = [
            `${setupForTrailing.direction} Basket | ${feed.symbol}`,
            `Locked Profit: +${PROFIT_LOCK_THRESHOLD} USC`,
            `Current Net Profit: +${basketNetProfit.toFixed(2)} USC`,
            `Active Positions: ${activePositions.length}`
          ].join('\\n');
          this.telegram.notify(title, msg, `PROFIT_LOCK_${setupForTrailing.id}`).catch(() => {});
        }
      }

      if (setupForTrailing.trailingState.profitLockActivated && basketNetProfit <= PROFIT_LOCK_THRESHOLD) {
        console.log(`[DaRa M1 EA v1.0] 🛡️ BASKET PROFIT LOCK HIT! Profit dropped to +${basketNetProfit.toFixed(2)} USC (Locked at +${PROFIT_LOCK_THRESHOLD} USC). Closing entire Basket!`);
        await this.closeBasket('PROFIT_LOCK_HIT', `Basket Net Profit dropped to +${basketNetProfit.toFixed(2)} USC`, currentBid, currentAsk);
        return;
      }

      const trailingResult = this.trailing.evaluateSetupTrailing("""

content = content.replace(target, replacement)

with open("src/engines/dara_m1/DaRaM1Engine.ts", "w") as f:
    f.write(content)

