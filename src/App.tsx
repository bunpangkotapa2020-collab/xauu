import React, { useState, useEffect, useCallback } from 'react';
import { BotState, AccountType } from './types';
import { botApi } from './services/api';
import { LoginView } from './components/LoginView';
import { MainDashboard } from './components/MainDashboard';
import { InstallAppModal } from './components/InstallAppModal';
import { Loader2 } from 'lucide-react';

const SESSION_STORAGE_KEY = 'xau_bot_session_v3';

const INITIAL_FALLBACK_STATE: BotState = {
  status: 'stopped',
  isDemo: true,
  goldPrice: 2748.50,
  spreadPoints: 12,
  account: {
    accountType: 'standard',
    server: 'Exness-Real21',
    loginId: '8492019',
    isConnected: true,
    vpsOnline: true,
    balance: 1500.00,
    equity: 1500.00,
    currency: 'USD',
  },
  todayProfitLoss: 38.50,
  todayTradeCount: 4,
  todayWinCount: 3,
  todayLossCount: 1,
  currentTrade: null,
  manualTrades: [],
  tradingHours: {
    enabled: true,
    startHour: '08:00',
    stopHour: '22:00',
  },
  riskConfig: {
    maxDailyLoss: 50.00,
    maxDrawdownPercent: 5.0,
    maxSpreadPoints: 25,
    lotSize: 0.02,
    stopLossPips: 25,
    takeProfitPips: 35,
    trailingStopEnabled: true,
    noMartingale: true,
    noGrid: true,
  },
  serverTime: '12:00:00',
  isInsideTradingHours: true,
  dailyLossLimitHit: false,
  magicNumber: 778899,
  statusMessageKhmer: 'Bot បានបញ្ឈប់ (Stopped) — ចុច «START» ដើម្បីដំណើរការ',
};

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>('Admin (Owner)');
  const [userRole, setUserRole] = useState<'admin' | 'demo'>('admin');
  const [botState, setBotState] = useState<BotState>(INITIAL_FALLBACK_STATE);
  const [isLoading, setIsLoading] = useState(true);
  
  // PWA & Install Modal state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // Fetch bot state
  const fetchState = useCallback(async () => {
    try {
      const state = await botApi.getBotState();
      setBotState(state);
    } catch (err) {
      console.warn('Could not poll bot state, using local fallback state:', err);
    }
  }, []);

  // Initial Session Verification & PWA check
  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Verify session with backend
    const initSession = async () => {
      try {
        const session = await botApi.verifySession();
        if (session.valid && session.user) {
          setIsLoggedIn(true);
          setUserRole(session.user.role || 'admin');
          setCurrentUser(session.user.role === 'admin' ? 'Admin (Owner)' : 'Demo Sandbox');
        } else {
          // If no active token found, check local demo flag or stay on login
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
        fetchState();
      }
    };

    initSession();

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [fetchState]);

  const triggerPWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      }
      setDeferredPrompt(null);
    }
  };

  // Poll state every 1.5 seconds if logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [fetchState, isLoggedIn]);

  // Auth Handlers with backend session verification
  const handleLoginSuccess = async (isDemo: boolean, username: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await botApi.login(username, password || 'Admin_XAUUSD_2026!', isDemo);
      const role = res.user?.role || (isDemo ? 'demo' : 'admin');
      setCurrentUser(role === 'admin' ? 'Admin (Owner)' : 'Demo Sandbox');
      setUserRole(role as 'admin' | 'demo');
      setIsLoggedIn(true);
      await fetchState();
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setIsLoading(true);
    try {
      const res = await botApi.login(undefined, undefined, true);
      setCurrentUser('Demo Sandbox');
      setUserRole('demo');
      setIsLoggedIn(true);
      await fetchState();
    } catch (err) {
      console.error('Quick demo error:', err);
      setIsLoggedIn(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await botApi.logout();
    setIsLoggedIn(false);
  };

  // Bot Action Handlers
  const handleAction = async (action: any, payload?: any) => {
    try {
      const res = await botApi.sendAction(action, payload);
      if (res?.state) {
        setBotState(res.state);
      } else {
        await fetchState();
      }
    } catch (err: any) {
      alert(err.message || 'ប្រតិបត្តិការបរាជ័យ');
    }
  };

  const handleSimulateTest = async (testType: any) => {
    try {
      const res = await botApi.simulateTest(testType);
      if (res?.state) {
        setBotState(res.state);
      } else {
        await fetchState();
      }
    } catch (err: any) {
      alert(err.message || 'Simulation test failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs font-mono">កំពុងតភ្ជាប់ទៅ XAUUSD AI Scalping Engine...</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onQuickDemo={handleQuickDemo}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
          onInstallPWA={triggerPWAInstall}
          isStandalone={isStandalone}
        />
      </>
    );
  }

  return (
    <>
      <MainDashboard
        botState={botState}
        onAction={handleAction}
        onSimulateTest={handleSimulateTest}
        onLogout={handleLogout}
        currentUser={currentUser}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        isStandalone={isStandalone}
      />
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallPWA={triggerPWAInstall}
        isStandalone={isStandalone}
      />
    </>
  );
}

export default App;
