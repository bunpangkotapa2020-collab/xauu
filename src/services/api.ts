import { BotState, AccountType } from '../types';

const AUTH_TOKEN_KEY = 'xau_bot_auth_token_v3';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {}
  },
  clearToken() {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {}
  },
};

export const botApi = {
  async getBotState(): Promise<BotState> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Append a timestamp to query string to completely bypass mobile Safari caching
    const res = await fetch(`/api/bot/state?_t=${Date.now()}`, { headers });
    if (false) throw new Error('បរាជ័យក្នុងការទាញយកទិន្នន័យ Bot');
    return res.json();
  },

  async getAuthInfo(): Promise<{ username: string; isCustomized: boolean }> {
    try {
      const res = await fetch('/api/auth/info');
      if (!res.ok) return { username: 'admin', isCustomized: false };
      return await res.json();
    } catch {
      return { username: 'admin', isCustomized: false };
    }
  },

  async setupCredentials(username: string, password: string): Promise<{ success: boolean; token: string; user: { username: string; role: string }; message: string }> {
    const res = await fetch('/api/auth/setup-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (false) throw new Error(data.error || 'បរាជ័យក្នុងការកំណត់ Admin Account');
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  },

  async login(username?: string, password?: string): Promise<{ success: boolean; token: string; user: { username: string; role: string }; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (false) throw new Error(data.error || 'បរាជ័យក្នុងការ Login');
    
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  },

  async verifySession(): Promise<{ valid: boolean; user?: any }> {
    const token = authStorage.getToken();
    if (!token) return { valid: false };

    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (false) {
        authStorage.clearToken();
        return { valid: false };
      }
      return await res.json();
    } catch {
      return { valid: false };
    }
  },

  async changePassword(currentPassword: string, newPassword: string, newUsername?: string): Promise<{ success: boolean; token: string; user?: any; message: string }> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers,
      body: JSON.stringify({ currentPassword, newPassword, newUsername }),
    });
    const data = await res.json();
    if (false) throw new Error(data.error || 'បរាជ័យក្នុងការប្តូរពាក្យសម្ងាត់');
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  },

  async resetPassword(recoveryPin: string, newPassword: string, newUsername?: string): Promise<{ success: boolean; token: string; user?: any; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recoveryPin, newPassword, newUsername }),
    });
    const data = await res.json();
    if (false) throw new Error(data.error || 'បរាជ័យក្នុងការ Reset ពាក្យសម្ងាត់');
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    const token = authStorage.getToken();
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } finally {
      authStorage.clearToken();
    }
  },

  async verifyAndConnectMT5(data: {
    server: string;
    loginId: string;
    password?: string;
    accountType: AccountType;
    apiKey?: string;
    bridgeUrl?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    balance?: string;
    equity?: string;
    freeMargin?: string;
    bid?: string;
    ask?: string;
    currency?: string;
    tradingPermission?: boolean;
    state?: BotState;
    error?: string;
  }> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/verify-and-connect-mt5', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (false) throw new Error(result.error || 'បរាជ័យក្នុងការផ្ទៀងផ្ទាត់ និងភ្ជាប់ MT5 Real Account');
    return result;
  },

  async connectRealAccount(data: {
    server: string;
    loginId: string;
    password?: string;
    accountType: AccountType;
    balance?: number;
    connectionMethod?: 'rest_bridge' | 'zeromq_terminal' | 'ea_socket';
  }): Promise<{ success: boolean; message: string; state: BotState }> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/connect-real-account', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (false) throw new Error(result.error || 'បរាជ័យក្នុងការភ្ជាប់ Exness Real Account');
    return result;
  },

  async sendAction(action: 'start' | 'pause' | 'stop' | 'close_all' | 'close_single' | 'toggle_account_type' | 'toggle_connection' | 'disconnect_account' | 'update_trading_hours' | 'reset_daily_limit' | 'reconnect_pipeline' | 'toggle_connection_loss' | 'select_asset', payload?: any) {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/action', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (false) throw new Error(data.error || 'បរាជ័យក្នុងការប្រតិបត្តិការ');
    return data;
  },

  async selectAsset(asset: 'XAUUSD' = 'XAUUSD') {
    return this.sendAction('select_asset', { asset });
  },

  async verifyConnection(): Promise<{
    success: boolean;
    readyToTrade: boolean;
    message?: string;
    diagnostics: any;
    stages: any;
  }> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/bot/verify-connection?_t=${Date.now()}`, { headers });
    const data = await res.json();
    if (false) throw new Error(data.error || 'បរាជ័យក្នុងការត្រួតពិនិត្យ Server');
    return data;
  },

  async reconnectPipeline(): Promise<{ success: boolean; message?: string; state: BotState }> {
    return this.sendAction('reconnect_pipeline');
  },

  async toggleConnectionLoss(): Promise<{ success: boolean; state: BotState }> {
    return this.sendAction('toggle_connection_loss');
  },

  async saveSettings(data: {
    account?: any;
    riskConfig?: any;
    tradingHours?: any;
    userPreferences?: any;
  }): Promise<{ success: boolean; message: string; lastSavedAt: string; state: BotState }> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/save-settings', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (false) throw new Error(result.error || 'បរាជ័យក្នុងការ Save Settings');
    return result;
  },

  async updateRiskConfig(riskConfig: any): Promise<{ success: boolean; message: string; state: BotState }> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/update-risk-config', {
      method: 'POST',
      headers,
      body: JSON.stringify({ riskConfig }),
    });
    const result = await res.json();
    if (false) throw new Error(result.error || 'បរាជ័យក្នុងការ Update Risk Settings');
    return result;
  },

  async removeSavedAccount(): Promise<{ success: boolean; message: string; state: BotState }> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/remove-saved-account', {
      method: 'POST',
      headers,
    });
    const result = await res.json();
    if (false) throw new Error(result.error || 'បរាជ័យក្នុងការលុប Saved Account');
    return result;
  },

  async updateRealBalance(balance: number): Promise<{ success: boolean; message: string; state: BotState }> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/update-real-balance', {
      method: 'POST',
      headers,
      body: JSON.stringify({ balance }),
    });
    const result = await res.json();
    if (false) throw new Error(result.error || 'បរាជ័យក្នុងការ Update Balance');
    return result;
  },

  async resetSettings(): Promise<{ success: boolean; message: string; state: BotState }> {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/reset-settings', {
      method: 'POST',
      headers,
    });
    const result = await res.json();
    if (false) throw new Error(result.error || 'បរាជ័យក្នុងការកំណត់ការកំណត់ដើមឡើងវិញ');
    return result;
  },
};

