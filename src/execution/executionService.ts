import { BotState, TradingViewSignal, ExecutionStatus, Action } from '../types';
import { BrokerInterface, PaperBroker, MetaApiBroker } from '../broker/metaApiBroker';
import { riskManager } from '../risk/riskManager';
import { auditLogger } from '../logging/auditLogger';

export class ExecutionService {
  private paperBroker: PaperBroker;
  private metaApiBroker: MetaApiBroker | null = null;
  private processedSignalIds: Set<string> = new Set();

  constructor(paperBroker: PaperBroker) {
    this.paperBroker = paperBroker;
  }

  updateMetaApiBroker(config: { accountId: string; token: string; region: string }) {
    if (config.accountId && config.token) {
      this.metaApiBroker = new MetaApiBroker(config.accountId, config.token, config.region);
    } else {
      this.metaApiBroker = null;
    }
  }

  async processSignal(state: BotState, signal: TradingViewSignal): Promise<{ success: boolean; status: ExecutionStatus; signal_id?: string; reason?: string }> {
    const { action, symbol, price, signal_id, secret } = signal;

    // 1. Authentication
    if (secret !== state.settings.webhookSecret) {
      auditLogger.log({
        signal_id, action, symbol, tv_price: price,
        auth_result: 'FAIL', execution_status: 'BLOCKED', block_reason: 'INVALID_SECRET'
      });
      return { success: false, status: 'BLOCKED', reason: 'INVALID_SECRET' };
    }

    // 2. Duplicate Check
    if (this.processedSignalIds.has(signal_id)) {
      auditLogger.log({
        signal_id, action, symbol, tv_price: price,
        auth_result: 'PASS', duplicate_result: 'FAIL', execution_status: 'DUPLICATE'
      });
      return { success: false, status: 'DUPLICATE' };
    }
    this.processedSignalIds.add(signal_id);

    // 3. Action Validation
    if (action !== 'BUY' && action !== 'SELL') {
      auditLogger.log({
        signal_id, action: 'UNKNOWN', symbol, tv_price: price,
        auth_result: 'PASS', duplicate_result: 'PASS', execution_status: 'BLOCKED', block_reason: 'INVALID_ACTION'
      });
      return { success: false, status: 'BLOCKED', reason: 'INVALID_ACTION' };
    }

    // 4. Symbol Mapping
    const mappedSymbol = state.settings.symbolMapping[symbol] || symbol;

    // 5. Risk Check (Start/Stop Trading is checked here)
    const riskCheck = riskManager.validate(state, signal);
    if (!riskCheck.allowed) {
      auditLogger.log({
        signal_id, action, symbol: mappedSymbol, tv_price: price,
        auth_result: 'PASS', duplicate_result: 'PASS', risk_result: 'FAIL',
        execution_status: 'BLOCKED', block_reason: riskCheck.reason
      });
      return { success: false, status: 'BLOCKED', reason: riskCheck.reason };
    }

    // 6. Select Broker
    let activeBroker: BrokerInterface = this.paperBroker;
    if (state.settings.tradingMode === 'LIVE') {
      if (!this.metaApiBroker) {
        return { success: false, status: 'BLOCKED', reason: 'BROKER_NOT_CONFIGURED' };
      }
      if (!state.settings.metaApi.connected) {
        return { success: false, status: 'BLOCKED', reason: 'BROKER_NOT_CONNECTED' };
      }
      activeBroker = this.metaApiBroker;
    }

    // 7. Order Execution
    const { sl: initialSl, tp: initialTp } = riskManager.calculateSLTP(action, price, state.settings);
    const result = await activeBroker.executeOrder(mappedSymbol, action, state.settings.lotSize, initialSl, initialTp);

    if (result.success && result.ticket) {
      // Re-align SL/TP with actual fill price
      const fillPrice = result.fillPrice || price;
      const { sl: finalSl, tp: finalTp } = riskManager.calculateSLTP(action, fillPrice, state.settings);

      // Modify active broker position so SL/TP exactly matches finalSl/finalTp
      const protectResult = await activeBroker.modifyPositionProtection(result.ticket, finalSl, finalTp);

      if (!protectResult.success) {
        auditLogger.log({
          signal_id, action, symbol: mappedSymbol, tv_price: price,
          auth_result: 'PASS', duplicate_result: 'PASS', risk_result: 'PASS',
          execution_status: 'FAILED', broker_ticket: result.ticket,
          actual_fill_price: fillPrice, sl: finalSl, tp: finalTp,
          protection_status: 'UNPROTECTED',
          error_reason: `PROTECTION_FAILED: ${protectResult.error || 'Failed to modify broker SL/TP'}`
        });

        return {
          success: false,
          status: 'FAILED',
          signal_id,
          reason: `PROTECTION_FAILED: ${protectResult.error || 'Active position is unprotected'}`
        };
      }

      auditLogger.log({
        signal_id, action, symbol: mappedSymbol, tv_price: price,
        auth_result: 'PASS', duplicate_result: 'PASS', risk_result: 'PASS',
        execution_status: 'EXECUTED', broker_ticket: result.ticket,
        actual_fill_price: fillPrice, sl: finalSl, tp: finalTp,
        protection_status: 'PROTECTED'
      });

      return { success: true, status: 'EXECUTED', signal_id };
    } else {
      auditLogger.log({
        signal_id, action, symbol: mappedSymbol, tv_price: price,
        auth_result: 'PASS', duplicate_result: 'PASS', risk_result: 'PASS',
        execution_status: 'FAILED', error_reason: result.error
      });
      return { success: false, status: 'FAILED', reason: result.error };
    }
  }

  async closeAllPositions(mode: 'PAPER' | 'LIVE'): Promise<{ success: boolean; closedCount: number; errors?: string[] }> {
    if (mode === 'LIVE') {
      if (!this.metaApiBroker) return { success: false, closedCount: 0, errors: ['Broker not configured'] };
      return await this.metaApiBroker.closeAllPositions();
    } else {
      return await this.paperBroker.closeAllPositions();
    }
  }

  async testMetaApiConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.metaApiBroker) return { success: false, message: 'Broker not configured' };
    return await this.metaApiBroker.testConnection();
  }
}
