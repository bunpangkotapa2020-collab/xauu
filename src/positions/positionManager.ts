import { Trade, BotState } from '../types';
import { BrokerInterface } from '../broker/metaApiBroker';

export class PositionManager {
  async syncPositions(state: BotState, broker: BrokerInterface): Promise<Trade[]> {
    const brokerPositions = await broker.getOpenPositions();
    state.openPositions = brokerPositions;
    return brokerPositions;
  }

  calculateDailyPnL(signalHistory: any[]): number {
    return 0; // Simplified for now
  }
}

export const positionManager = new PositionManager();
