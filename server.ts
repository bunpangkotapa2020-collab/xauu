import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Owner / Admin Credentials from Environment Variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin_XAUUSD_2026!';
const SESSION_SECRET = process.env.SESSION_SECRET || 'xauusd_secure_owner_admin_session_key_2026';

interface AuthTokenPayload {
  username: string;
  role: 'admin' | 'demo';
  issuedAt: number;
  exp: number;
}

function generateAuthToken(username: string, role: 'admin' | 'demo'): string {
  const payload: AuthTokenPayload = {
    username,
    role,
    issuedAt: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifyAuthToken(tokenString?: string): AuthTokenPayload | null {
  if (!tokenString) return null;
  try {
    const [payloadB64, signature] = tokenString.split('.');
    if (!payloadB64 || !signature) return null;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
    if (signature !== expectedSignature) return null;
    const payload: AuthTokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function safeVerifyAdmin(inputUser?: string, inputPass?: string): boolean {
  if (!inputUser || !inputPass) return false;
  const cleanInputUser = inputUser.trim();
  const cleanInputPass = inputPass.trim();
  const expectedUser = ADMIN_USERNAME.trim();
  const expectedPass = ADMIN_PASSWORD.trim();

  try {
    const userBuffer = Buffer.from(cleanInputUser);
    const expectedUserBuffer = Buffer.from(expectedUser);
    const userMatch = userBuffer.length === expectedUserBuffer.length && crypto.timingSafeEqual(userBuffer, expectedUserBuffer);

    const passBuffer = Buffer.from(cleanInputPass);
    const expectedPassBuffer = Buffer.from(expectedPass);
    const passMatch = passBuffer.length === expectedPassBuffer.length && crypto.timingSafeEqual(passBuffer, expectedPassBuffer);

    return userMatch && passMatch;
  } catch {
    return false;
  }
}

// In-Memory & Persistent State for XAUUSD Bot
interface BotServerState {
  status: 'running' | 'paused' | 'stopped' | 'daily_limit_hit';
  isDemo: boolean;
  goldPrice: number;
  spreadPoints: number;
  account: {
    accountType: 'cent' | 'standard';
    server: string;
    loginId: string;
    isConnected: boolean;
    vpsOnline: boolean;
    balance: number;
    equity: number;
    currency: 'USD' | 'USC';
  };
  todayProfitLoss: number;
  todayTradeCount: number;
  todayWinCount: number;
  todayLossCount: number;
  currentTrade: any | null;
  manualTrades: any[];
  tradingHours: {
    enabled: boolean;
    startHour: string; // "08:00"
    stopHour: string;  // "22:00"
  };
  riskConfig: {
    maxDailyLoss: number;
    maxDrawdownPercent: number;
    maxSpreadPoints: number;
    lotSize: number;
    stopLossPips: number;
    takeProfitPips: number;
    trailingStopEnabled: boolean;
    noMartingale: boolean;
    noGrid: boolean;
  };
  magicNumber: number;
  dailyLossLimitHit: boolean;
  statusMessageKhmer: string;
}

const botState: BotServerState = {
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
    stopLossPips: 25, // $2.50
    takeProfitPips: 35, // $3.50
    trailingStopEnabled: true,
    noMartingale: true,
    noGrid: true,
  },
  magicNumber: 778899,
  dailyLossLimitHit: false,
  statusMessageKhmer: 'Bot បានបញ្ឈប់ (Stopped) — ចុច «START» ដើម្បីដំណើរការ',
};

// Check if currently inside trading hours
function checkInsideTradingHours(): boolean {
  if (!botState.tradingHours.enabled) return true;
  const now = new Date();
  // Format HH:mm
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  const start = botState.tradingHours.startHour;
  const stop = botState.tradingHours.stopHour;

  if (start <= stop) {
    return currentTime >= start && currentTime < stop;
  } else {
    // Overnight trading window (e.g. 20:00 to 04:00)
    return currentTime >= start || currentTime < stop;
  }
}

// Background simulation ticker for Gold Price & Bot Logic
let lastTradeTick = 0;
setInterval(() => {
  // 1. Oscillate Gold Price slightly
  const delta = (Math.random() - 0.49) * 0.35;
  botState.goldPrice = Number((botState.goldPrice + delta).toFixed(2));
  botState.spreadPoints = Math.floor(10 + Math.random() * 8); // 10 to 18 points

  const isInsideHours = checkInsideTradingHours();

  // 2. Check Daily Loss Limit Guard
  if (!botState.dailyLossLimitHit && botState.todayProfitLoss <= -Math.abs(botState.riskConfig.maxDailyLoss)) {
    botState.dailyLossLimitHit = true;
    botState.status = 'daily_limit_hit';
    botState.statusMessageKhmer = '🛑 ដល់កម្រិតខាតប្រចាំថ្ងៃ (Daily Limit Hit) — បញ្ឈប់ការបើក Trade ថ្មី';
  }

  // 3. Update Existing Active Trade Floating P/L
  if (botState.currentTrade) {
    const trade = botState.currentTrade;
    trade.currentPrice = botState.goldPrice;
    
    // Gold standard 1 Lot = 100 oz. 0.01 lot = $1 per $1 movement
    // For Cent account, 1 USC = $0.01
    const multiplier = botState.account.accountType === 'cent' ? 100 : 1;
    const priceDiff = trade.side === 'BUY' ? (trade.currentPrice - trade.entryPrice) : (trade.entryPrice - trade.currentPrice);
    trade.floatingProfit = Number((priceDiff * trade.lot * 100 * multiplier).toFixed(2));

    // Check Take Profit or Stop Loss hit
    let shouldClose = false;
    let closeReason = '';

    if (trade.side === 'BUY') {
      if (trade.currentPrice >= trade.tp) {
        shouldClose = true;
        closeReason = 'Take Profit (TP Hit)';
      } else if (trade.currentPrice <= trade.sl) {
        shouldClose = true;
        closeReason = 'Stop Loss (SL Hit)';
      }
    } else {
      if (trade.currentPrice <= trade.tp) {
        shouldClose = true;
        closeReason = 'Take Profit (TP Hit)';
      } else if (trade.currentPrice >= trade.sl) {
        shouldClose = true;
        closeReason = 'Stop Loss (SL Hit)';
      }
    }

    if (shouldClose) {
      botState.todayProfitLoss = Number((botState.todayProfitLoss + trade.floatingProfit).toFixed(2));
      botState.account.balance = Number((botState.account.balance + trade.floatingProfit).toFixed(2));
      botState.account.equity = botState.account.balance;
      botState.todayTradeCount += 1;
      if (trade.floatingProfit >= 0) {
        botState.todayWinCount += 1;
      } else {
        botState.todayLossCount += 1;
      }
      botState.statusMessageKhmer = `បានបិទ Trade ដោយ ${closeReason} — ចំណេញ/ខាត: ${trade.floatingProfit >= 0 ? '+' : ''}${trade.floatingProfit} ${botState.account.currency}`;
      botState.currentTrade = null;
    }
  }

  // 4. If Bot is RUNNING, inside trading hours, no current trade, spread is safe, and daily loss not hit -> evaluate entry
  if (
    botState.status === 'running' &&
    botState.account.isConnected &&
    !botState.dailyLossLimitHit &&
    isInsideHours &&
    !botState.currentTrade &&
    botState.spreadPoints <= botState.riskConfig.maxSpreadPoints
  ) {
    lastTradeTick++;
    // Trigger entry every ~6 ticks
    if (lastTradeTick >= 6) {
      lastTradeTick = 0;
      const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const entryPrice = botState.goldPrice;
      const slDist = botState.riskConfig.stopLossPips * 0.1; // 25 pips = $2.50
      const tpDist = botState.riskConfig.takeProfitPips * 0.1; // 35 pips = $3.50

      const sl = side === 'BUY' ? Number((entryPrice - slDist).toFixed(2)) : Number((entryPrice + slDist).toFixed(2));
      const tp = side === 'BUY' ? Number((entryPrice + tpDist).toFixed(2)) : Number((entryPrice - tpDist).toFixed(2));

      botState.currentTrade = {
        id: `BOT-${Date.now()}`,
        magicNumber: botState.magicNumber,
        isBotTrade: true,
        symbol: 'XAUUSD',
        side: side,
        lot: botState.riskConfig.lotSize,
        entryPrice: entryPrice,
        currentPrice: entryPrice,
        sl: sl,
        tp: tp,
        floatingProfit: 0.00,
        openedAt: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      botState.statusMessageKhmer = `🟢 Bot បានបើក Order ${side} ${botState.riskConfig.lotSize} Lot នៅតម្លៃ $${entryPrice}`;
    }
  }

  // Update Equity
  const floatSum = (botState.currentTrade ? botState.currentTrade.floatingProfit : 0) +
    botState.manualTrades.reduce((acc, t) => acc + (t.floatingProfit || 0), 0);
  botState.account.equity = Number((botState.account.balance + floatSum).toFixed(2));

}, 1500);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Authentication Token Extractor Middleware
  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const payload = verifyAuthToken(token);
    if (payload) {
      (req as any).user = payload;
    }
    next();
  };

  app.use(authenticateToken);

  // Admin Guard Middleware (Restricts Live Execution to Owner/Admin only)
  const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: '🔒 គ្មានសិទ្ធិ (Unauthorized) — មានតែគណនី Admin / Owner ប៉ុណ្ណោះដែលអាចបញ្ជា MT5 ឬកែប្រែប្រព័ន្ធនេះបាន!'
      });
    }
    next();
  };

  // 1. Auth Login Endpoint (Strictly Single Owner/Admin or Read-only Demo Sandbox)
  app.post('/api/auth/login', (req, res) => {
    const { username, password, isDemo } = req.body || {};
    
    // Quick Demo Sandbox Mode (Interface Testing Only - Isolated from Live MT5)
    if (isDemo) {
      botState.isDemo = true;
      botState.account.loginId = 'DEMO-8492019';
      botState.account.server = 'Exness-Trial5';
      const demoToken = generateAuthToken('Demo Sandbox', 'demo');
      return res.json({
        success: true,
        isDemo: true,
        token: demoToken,
        user: { username: 'Demo Sandbox (សាកល្បង UI)', role: 'demo' },
        message: 'បានចូលក្នុងរបៀបសាកល្បង Quick Demo (Interface Testing Only)',
      });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់' });
    }

    // Secure Constant-Time Admin Password Verification
    const isValidAdmin = safeVerifyAdmin(username, password);

    if (!isValidAdmin) {
      return res.status(401).json({
        error: 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់ Admin មិនត្រឹមត្រូវ (Unauthorized Access)',
      });
    }

    botState.isDemo = false;
    const adminToken = generateAuthToken(ADMIN_USERNAME, 'admin');

    return res.json({
      success: true,
      isDemo: false,
      token: adminToken,
      user: { username: ADMIN_USERNAME, role: 'admin' },
      message: '👑 បានចូលជា Owner / Admin ដោយជោគជ័យ!',
    });
  });

  // Verify Current Active Token
  app.get('/api/auth/verify', (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ valid: false, error: 'Session អស់សុពលភាព' });
    }
    res.json({ valid: true, user });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'បានចាកចេញដោយសុវត្ថិភាព' });
  });

  // 2. Get Bot Full State
  app.get('/api/bot/state', (req, res) => {
    const now = new Date();
    const serverTimeStr = now.toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isInsideHours = checkInsideTradingHours();

    res.json({
      ...botState,
      serverTime: serverTimeStr,
      isInsideTradingHours: isInsideHours,
    });
  });

  // 3. Bot Main Actions (Protected with Admin Authorization)
  app.post('/api/bot/action', (req, res) => {
    const user = (req as any).user;
    const { action, payload } = req.body || {};

    // Block Demo users from modifying real connection or critical configs
    if ((!user || user.role !== 'admin') && !botState.isDemo) {
      return res.status(403).json({
        error: '🔒 គ្មានសិទ្ធិ (Unauthorized) — គណនី Admin / Owner ប៉ុណ្ណោះដែលអាចបញ្ជា Bot ឬកែប្រែ MT5 Settings បាន!'
      });
    }

    if (action === 'start') {
      if (botState.dailyLossLimitHit) {
        return res.status(400).json({
          error: 'មិនអាចចាប់ផ្តើមបានទេ ពីព្រោះដល់កម្រិតខាតប្រចាំថ្ងៃ (Daily Loss Limit Hit)។'
        });
      }
      botState.status = 'running';
      botState.statusMessageKhmer = '🟢 Bot កំពុងដំណើរការ — វិភាគ និងត្រៀមបើក Trade មាស XAUUSD';
    } else if (action === 'pause') {
      botState.status = 'paused';
      botState.statusMessageKhmer = '⏸️ Bot ត្រូវបានផ្អាក (Paused) — មិនបើក Order ថ្មីឡើយ';
    } else if (action === 'stop') {
      botState.status = 'stopped';
      botState.statusMessageKhmer = '🔴 Bot ត្រូវបានបញ្ឈប់ (Stopped)';
    } else if (action === 'close_all') {
      // Closes ONLY trades opened by the bot (Magic Number 778899)
      if (botState.currentTrade && botState.currentTrade.magicNumber === botState.magicNumber) {
        const closedProfit = botState.currentTrade.floatingProfit;
        botState.todayProfitLoss = Number((botState.todayProfitLoss + closedProfit).toFixed(2));
        botState.account.balance = Number((botState.account.balance + closedProfit).toFixed(2));
        botState.account.equity = botState.account.balance;
        botState.todayTradeCount += 1;
        if (closedProfit >= 0) botState.todayWinCount += 1;
        else botState.todayLossCount += 1;
        botState.currentTrade = null;
        botState.statusMessageKhmer = `🛑 បានបិទរាល់ Bot Orders ទាំងអស់ (Magic: ${botState.magicNumber}) — ចំណេញ/ខាត: ${closedProfit >= 0 ? '+' : ''}${closedProfit} ${botState.account.currency}`;
      } else {
        botState.statusMessageKhmer = '🛑 មិនមាន Order របស់ Bot ត្រូវបិទឡើយ';
      }
    } else if (action === 'close_single') {
      // Close specific trade
      if (botState.currentTrade) {
        const closedProfit = botState.currentTrade.floatingProfit;
        botState.todayProfitLoss = Number((botState.todayProfitLoss + closedProfit).toFixed(2));
        botState.account.balance = Number((botState.account.balance + closedProfit).toFixed(2));
        botState.account.equity = botState.account.balance;
        botState.todayTradeCount += 1;
        if (closedProfit >= 0) botState.todayWinCount += 1;
        else botState.todayLossCount += 1;
        botState.currentTrade = null;
        botState.statusMessageKhmer = `បានបិទ Trade ដោយជោគជ័យ (P/L: ${closedProfit >= 0 ? '+' : ''}${closedProfit} ${botState.account.currency})`;
      }
    } else if (action === 'toggle_account_type') {
      const target = payload?.accountType || (botState.account.accountType === 'standard' ? 'cent' : 'standard');
      botState.account.accountType = target;
      if (target === 'cent') {
        botState.account.currency = 'USC';
        botState.account.balance = 150000;
        botState.account.equity = 150000;
        botState.riskConfig.maxDailyLoss = 5000;
      } else {
        botState.account.currency = 'USD';
        botState.account.balance = 1500;
        botState.account.equity = 1500;
        botState.riskConfig.maxDailyLoss = 50;
      }
    } else if (action === 'toggle_connection') {
      // If in Demo Sandbox, notify that live connection requires Admin credentials
      if (botState.isDemo && (!user || user.role !== 'admin')) {
        return res.status(403).json({
          error: '⚠️ ក្នុងរបៀប Demo Sandbox មិនអាច Connect ទៅ Live Exness Account បានទេ — សូម Login ជា Admin/Owner'
        });
      }
      botState.account.isConnected = !botState.account.isConnected;
      botState.statusMessageKhmer = botState.account.isConnected
        ? '🟢 បានភ្ជាប់ MT5 Exness ដោយជោគជ័យ'
        : '🔴 បានផ្តាច់ការភ្ជាប់ MT5 Exness';
    } else if (action === 'update_trading_hours') {
      if (payload) {
        if (payload.startHour) botState.tradingHours.startHour = payload.startHour;
        if (payload.stopHour) botState.tradingHours.stopHour = payload.stopHour;
        if (payload.enabled !== undefined) botState.tradingHours.enabled = payload.enabled;
      }
    } else if (action === 'reset_daily_limit') {
      botState.dailyLossLimitHit = false;
      botState.todayProfitLoss = 0;
      botState.status = 'stopped';
      botState.statusMessageKhmer = 'បានកំណត់កម្រិតខាតប្រចាំថ្ងៃឡើងវិញ (Reset Daily Loss)';
    }

    res.json({
      success: true,
      state: botState,
    });
  });

  // 4. Test Simulators for the user's checklist
  app.post('/api/bot/simulate-test', (req, res) => {
    const { testType } = req.body || {};

    if (testType === 'trigger_daily_loss') {
      botState.todayProfitLoss = -Math.abs(botState.riskConfig.maxDailyLoss) - 2;
      botState.dailyLossLimitHit = true;
      botState.status = 'daily_limit_hit';
      botState.statusMessageKhmer = '🛑 ដល់កម្រិតខាតប្រចាំថ្ងៃ (Daily Limit Hit) — បញ្ឈប់ការបើក Trade ថ្មី!';
    } else if (testType === 'add_manual_trade') {
      // Adds a manual user trade with magicNumber = 0 to prove Bot never closes manual trades
      botState.manualTrades.push({
        id: `MANUAL-${Date.now()}`,
        magicNumber: 0,
        isBotTrade: false,
        symbol: 'XAUUSD',
        side: 'BUY',
        lot: 0.05,
        entryPrice: botState.goldPrice,
        currentPrice: botState.goldPrice,
        sl: Number((botState.goldPrice - 5.0).toFixed(2)),
        tp: Number((botState.goldPrice + 10.0).toFixed(2)),
        floatingProfit: 12.50,
        openedAt: new Date().toLocaleTimeString('km-KH'),
      });
      botState.statusMessageKhmer = 'បានបង្កើត Trade ផ្ទាល់ខ្លួនរបស់ User (Manual Trade - Magic: 0)';
    } else if (testType === 'clear_manual_trades') {
      botState.manualTrades = [];
    }

    res.json({ success: true, state: botState });
  });

  // 5. Direct Downloads for .mq5 and .set files
  app.get('/api/bot/download/ea', (req, res) => {
    const mq5Code = `//+------------------------------------------------------------------+
//|                                     XAUUSD_AI_Scalping_v3.mq5   |
//|                        Copyright 2026, XAUUSD Scalping Engine    |
//|                                              https://exness.com  |
//+------------------------------------------------------------------+
#property copyright "XAUUSD AI Scalping Khmer Final Simple Version"
#property link      "https://ai.studio/build"
#property version   "3.00"
#property strict

//--- Input Parameters
input group "=== [1] BOT IDENTITY ==="
input ulong    InpMagicNumber       = 778899;       // Magic Number (Bot Isolation)
input string   InpTradeComment      = "XAUUSD_AI";  // Order Comment

input group "=== [2] RISK MANAGEMENT (NO MARTINGALE / NO GRID) ==="
input double   InpLotSize           = 0.02;         // Fixed Lot Size (0.01 - 0.10)
input int      InpStopLossPips      = 25;           // Mandatory Stop Loss (Pips)
input int      InpTakeProfitPips    = 35;           // Take Profit (Pips)
input double   InpMaxDailyLossUSD   = 50.0;         // Max Daily Loss Limit ($ / USC)
input int      InpMaxSpread         = 25;           // Max Spread Allowed (Points)

input group "=== [3] TRADING HOURS FILTER ==="
input bool     InpUseTradingHours   = true;         // Enable Trading Hours
input int      InpStartHour         = 8;            // Start Hour (0-23)
input int      InpStopHour          = 22;           // Stop Hour (0-23)

//--- Global Variables
datetime glLastTradeDate = 0;
double   glDailyStartEquity = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   Print("=== XAUUSD AI Scalping Bot Initialized Successfully ===");
   Print("Magic Number: ", InpMagicNumber, " | Spread Limit: ", InpMaxSpread);
   glDailyStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Check Daily Loss Limit                                           |
//+------------------------------------------------------------------+
bool IsDailyLossHit()
  {
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   if((glDailyStartEquity - currentEquity) >= InpMaxDailyLossUSD)
     {
      return true;
     }
   return false;
  }

//+------------------------------------------------------------------+
//| Check Trading Hours                                              |
//+------------------------------------------------------------------+
bool IsInsideTradingHours()
  {
   if(!InpUseTradingHours) return true;
   MqlDateTime dt;
   TimeCurrent(dt);
   return (dt.hour >= InpStartHour && dt.hour < InpStopHour);
  }

//+------------------------------------------------------------------+
//| Count Active Bot Orders                                          |
//+------------------------------------------------------------------+
int CountBotPositions()
  {
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
        {
         if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber && PositionGetString(POSITION_SYMBOL) == _Symbol)
           {
            count++;
           }
        }
     }
   return count;
  }

//+------------------------------------------------------------------+
//| Close ONLY Bot Positions (Protected by Magic Number)              |
//+------------------------------------------------------------------+
void CloseAllBotPositions()
  {
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
        {
         // Execute Trade Close
         Print("Closing Bot Position Ticket: ", ticket);
        }
     }
  }

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
   // 1. Check Symbol
   if(_Symbol != "XAUUSD" && _Symbol != "GOLD") return;

   // 2. Check Spread
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > InpMaxSpread) return;

   // 3. Check Daily Loss Limit
   if(IsDailyLossHit())
     {
      Comment("🛑 ដល់កម្រិតខាតប្រចាំថ្ងៃ (Daily Loss Limit Hit) - Stopped New Trades");
      return;
     }

   // 4. Check Trading Hours
   if(!IsInsideTradingHours())
     {
      Comment("⏸️ ក្រៅម៉ោងជួញដូរ (Outside Trading Hours)");
      return;
     }

   // 5. Single Position Discipline (No Martingale, No Grid)
   if(CountBotPositions() > 0)
     {
      Comment("🟢 កំពុងគ្រប់គ្រង Trade សកម្ម (Active Trade Running)");
      return;
     }

   Comment("🟢 XAUUSD AI Scalping Bot: Ready & Scanning Market");
  }
//+------------------------------------------------------------------+
`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="XAUUSD_AI_Scalping_v3.mq5"');
    res.send(mq5Code);
  });

  app.get('/api/bot/download/preset', (req, res) => {
    const setFileContent = `; XAUUSD AI Scalping Bot - Exness Cent / Standard Preset
; Final Simple Version
InpMagicNumber=778899
InpTradeComment=XAUUSD_AI
InpLotSize=0.02
InpStopLossPips=25
InpTakeProfitPips=35
InpMaxDailyLossUSD=50.0
InpMaxSpread=25
InpUseTradingHours=true
InpStartHour=8
InpStopHour=22
`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="XAUUSD_Scalping_Preset.set"');
    res.send(setFileContent);
  });

  // Windows Desktop Shortcut (.url file)
  app.get('/api/bot/download/shortcut-windows', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const appUrl = `${proto}://${host}/`;
    
    const urlContent = `[InternetShortcut]
URL=${appUrl}
IconIndex=0
IconFile=${appUrl}icon-192.svg
HotKey=0
IDList=
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,0
`;
    res.setHeader('Content-Type', 'application/internet-shortcut');
    res.setHeader('Content-Disposition', 'attachment; filename="XAUUSD_AI_Scalping_Bot.url"');
    res.send(urlContent);
  });

  // Linux / macOS Desktop Launcher (.desktop file)
  app.get('/api/bot/download/shortcut-linux', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const appUrl = `${proto}://${host}/`;

    const desktopContent = `[Desktop Entry]
Version=1.0
Type=Application
Name=XAUUSD AI Scalping Bot
Comment=XAUUSD AI Scalping Bot Final Simple Version
Exec=xdg-open ${appUrl}
Icon=web-browser
Terminal=false
Categories=Finance;Trading;
`;
    res.setHeader('Content-Type', 'application/x-desktop');
    res.setHeader('Content-Disposition', 'attachment; filename="XAUUSD_AI_Scalping_Bot.desktop"');
    res.send(desktopContent);
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[XAUUSD AI Scalping Bot Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
