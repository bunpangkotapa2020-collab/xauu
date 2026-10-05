export class TradingScheduler {
  /**
   * PRE-LONDON: 07:50–07:59 UTC
   * TRADING: 08:00–20:59 UTC
   * NO NEW TRADES: 21:00–07:49 UTC
   */
  isInsideTradingWindow(): boolean {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const totalMinutes = utcHour * 60 + utcMinutes;

    const startMinutes = 8 * 60; // 08:00
    const endMinutes = 21 * 60; // 21:00

    return totalMinutes >= startMinutes && totalMinutes < endMinutes;
  }

  getTradingStatus(): string {
    return this.isInsideTradingWindow() ? 'TRADING' : 'NO NEW TRADES';
  }
}

export const tradingScheduler = new TradingScheduler();
