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
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/state', { headers });
    if (!res.ok) throw new Error('បរាជ័យក្នុងការទាញយកទិន្នន័យ Bot');
    return res.json();
  },

  async login(username?: string, password?: string, isDemo = false): Promise<{ success: boolean; isDemo: boolean; token: string; user: { username: string; role: string }; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, isDemo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'បរាជ័យក្នុងការ Login');
    
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
      if (!res.ok) {
        authStorage.clearToken();
        return { valid: false };
      }
      return await res.json();
    } catch {
      return { valid: false };
    }
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

  async sendAction(action: 'start' | 'pause' | 'stop' | 'close_all' | 'close_single' | 'toggle_account_type' | 'toggle_connection' | 'update_trading_hours' | 'reset_daily_limit', payload?: any) {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/action', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'បរាជ័យក្នុងការប្រតិបត្តិការ');
    return data;
  },

  async simulateTest(testType: 'trigger_daily_loss' | 'add_manual_trade' | 'clear_manual_trades') {
    const token = authStorage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/bot/simulate-test', {
      method: 'POST',
      headers,
      body: JSON.stringify({ testType }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'បរាជ័យក្នុងការ Test Simulation');
    return data;
  },
};

