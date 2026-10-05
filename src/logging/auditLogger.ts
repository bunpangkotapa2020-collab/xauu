import { AuditLog, ExecutionStatus, Action } from '../types';

export class AuditLogger {
  private logs: AuditLog[] = [];

  log(entry: Partial<AuditLog>) {
    const fullEntry: AuditLog = {
      timestamp: new Date().toISOString(),
      signal_id: entry.signal_id || 'N/A',
      action: entry.action || 'UNKNOWN',
      symbol: entry.symbol || 'N/A',
      tv_price: entry.tv_price || 0,
      auth_result: entry.auth_result || 'FAIL',
      duplicate_result: entry.duplicate_result || 'FAIL',
      risk_result: entry.risk_result || 'FAIL',
      execution_status: entry.execution_status || 'FAILED',
      ...entry
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > 100) {
      this.logs.pop();
    }
    
    console.log(`[AUDIT] ${fullEntry.timestamp} | ${fullEntry.signal_id} | ${fullEntry.action} | ${fullEntry.execution_status} | ${fullEntry.block_reason || fullEntry.error_reason || ''}`);
  }

  getLogs(): AuditLog[] {
    return this.logs;
  }
}

export const auditLogger = new AuditLogger();
