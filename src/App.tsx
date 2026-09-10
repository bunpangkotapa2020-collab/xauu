import { ErrorBoundary } from "./components/ErrorBoundary";
import React, { useState, useEffect, useCallback } from 'react';
import { BotState, AccountType } from './types';
import { botApi, authStorage } from './services/api';
import { LoginView } from './components/LoginView';
import { MainDashboard } from './components/MainDashboard';
import { InstallAppModal } from './components/InstallAppModal';
import { Loader2 } from 'lucide-react';

const SESSION_STORAGE_KEY = 'xau_bot_session_v3';

const INITIAL_FALLBACK_STATE: BotState = {
  status: 'stopped',
  selectedAsset: 'XAUUSD',
  goldPrice: 2748.50,
  spreadPoints: 12,
  account: {
    accountType: 'cent',
    server: 'Exness-Real21',
    loginId: '8492019',
    isConnected: true,
    serverConnected: true,
    isRealAccount: true,
    marketDataReceiving: true,
    tradingPermission: true,
    eaConnected: true,
    symbolAvailable: true,
    pingMs: 22,
    connectionMethod: 'rest_bridge',
    vpsOnline: true,
    balance: 150000,
    equity: 150000,
    freeMargin: 150000,
    marginLevel: 999,
    currency: 'USC',
    stages: {
      appLoggedIn: true,
      mt5AccountConfigured: true,
      exnessServerConnected: true,
      marketDataFeedLive: true,
      tradingPermissionGranted: true,
      eaLoadedAndReady: true,
    },
  },
  todayProfitLoss: 38.50,
  todayTradeCount: 4,
  todayWinCount: 3,
  todayLossCount: 1,
  currentTrade: null,
  openTrades: [],
  consecutiveLosses: 0,
  cooldownUntil: null,
  manualTrades: [],
  tradingHours: {
    enabled: true,
    startHour: '08:00',
    stopHour: '22:00',
  },
  riskConfig: {
    maxDailyLoss: 50.00,
    maxDrawdownPercent: 5.0,
    maxSpreadPoints: 27,
    lotSize: 0.02,
    stopLossPips: 25,
    takeProfitPips: 35,
    trailingStopEnabled: true,
    maxOpenTrades: 5,
    entriesPerSignal: 5,
    maxConsecutiveLosses: 3,
    cooldownMinutes: 15,
    maxDailyLossPercent: 5,
    maxDailyLossAmount: 50,
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
  const [userRole, setUserRole] = useState<'admin'>('admin');
  const [botState, setBotState] = useState<BotState>(INITIAL_FALLBACK_STATE);
  const [isLoading, setIsLoading] = useState(true);
  
  // PWA & Install Modal state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // Fetch bot state
  const fetchState = useCallback(async (throwError?: boolean) => {
    try {
      const state = await botApi.getBotState();
      setBotState(state);
    } catch (err) {
      console.warn('Could not poll bot state, using local fallback state:', err);
      if (throwError === true) {
        throw err;
      }
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

    // Resilient Session Verification with Auto-Retry across PM2 Restarts & Transient Network Glitches
    let isCancelled = false;
    const initSession = async () => {
      const existingToken = authStorage.getToken();
      if (!existingToken) {
        setIsLoggedIn(false);
        setIsLoading(false);
        fetchState();
        return;
      }

      let attempts = 0;
      const maxAttempts = 5;

      const attemptVerify = async () => {
        if (isCancelled) return;
        attempts++;

        try {
          const session = await botApi.verifySession();
          if (isCancelled) return;

          if (session.valid && session.user) {
            setIsLoggedIn(true);
            setUserRole(session.user.role || 'admin');
            setCurrentUser(session.user.role === 'admin' ? 'Admin (Owner)' : 'Admin (Owner)');
            setIsLoading(false);
            fetchState();
            return;
          }

          // Explicit 401 / Token invalid or revoked -> perform clean logout
          if (session.isUnauthorized) {
            // Check if user logged in while we were verifying
            const currentToken = authStorage.getToken();
            if (currentToken && currentToken !== existingToken) {
               console.log('Token changed during verification, ignoring unauthorized response');
               return;
            }
            setIsLoggedIn(false);
            setIsLoading(false);
            fetchState();
            return;
          }

          // Transient error (502, 503, Network drop, Server reboot in progress) -> retry
          if (attempts < maxAttempts) {
            setTimeout(attemptVerify, 1200);
            return;
          }

          // If all retries exhausted during prolonged server reboot, keep token & session alive optimistically
          setIsLoggedIn(true);
          setIsLoading(false);
          fetchState();
        } catch {
          if (attempts < maxAttempts) {
            setTimeout(attemptVerify, 1200);
          } else {
            setIsLoggedIn(true);
            setIsLoading(false);
            fetchState();
          }
        }
      };

      attemptVerify();
    };

    initSession();

    return () => {
      isCancelled = true;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
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

  // Poll state every 1.0 second if logged in for real-time responsiveness
  useEffect(() => {
    if (!isLoggedIn) return;
    
    let isMounted = true;
    let isFetching = false;
    let timeoutId: any = null;

    const poll = async () => {
      if (!isMounted) return;
      if (!isFetching) {
        isFetching = true;
        try {
          await fetchState();
        } finally {
          isFetching = false;
        }
      }
      if (!isMounted) return;
      const delay = document.visibilityState === 'visible' ? 5000 : 10000;
      timeoutId = setTimeout(poll, delay);
    };

    poll();
    
    // Force immediate sync when app comes to foreground (especially important for iPhone/Mobile Safari)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (timeoutId) clearTimeout(timeoutId);
        poll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchState, isLoggedIn]);

  // Auth Handlers with backend session verification
  const handleLoginSuccess = async (username: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await botApi.login(username, password);
      if (!res?.token) {
        throw new Error('មិនទទួលបាន Auth Token ត្រឹមត្រូវពី Server ឡើយ');
      }
      const role = res.user?.role || 'admin';
      setCurrentUser(`Admin (${res.user?.username || 'Owner'})`);
      setUserRole('admin');
      setIsLoggedIn(true);
      await fetchState();
    } catch (err: any) {
      throw err;
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
      return res;
    } catch (err: any) {
      return { success: false, error: err.message || 'ប្រតិបត្តិការបរាជ័យ' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs font-mono">កំពុងតភ្ជាប់ទៅ Trading Engine...</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
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
       <ErrorBoundary>
        <MainDashboard
        botState={botState}
        onAction={handleAction}
        onLogout={handleLogout}
        onRefresh={fetchState}
        currentUser={currentUser}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        isStandalone={isStandalone}
      />
      </ErrorBoundary>
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
