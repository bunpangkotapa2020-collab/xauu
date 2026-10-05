import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initialState } from './src/config/index.js';
import { PaperBroker } from './src/broker/metaApiBroker.js';
import { ExecutionService } from './src/execution/executionService.js';
import { BotState } from './src/types/index.js';
import { auditLogger } from './src/logging/auditLogger.js';
import { riskManager } from './src/risk/riskManager.js';
import { positionManager } from './src/positions/positionManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const app = express();
const port = isProduction ? (process.env.PORT || 3000) : 3000;

app.use(express.json());

// --- PERSISTENCE ---
const DB_FILE = path.join(__dirname, 'db.json');
let botState: BotState;

try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    botState = JSON.parse(data);
    console.log('[SERVER] State restored from db.json');
  } else {
    botState = { ...initialState };
    console.log('[SERVER] Initial state created');
  }
} catch (err) {
  console.error('[SERVER] Failed to load state, using initial state');
  botState = { ...initialState };
}

const saveState = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(botState, null, 2));
  } catch (err) {
    console.error('[SERVER] Failed to save state');
  }
};

// --- CORE SERVICES ---
const paperBroker = new PaperBroker();
const executionService = new ExecutionService(paperBroker);

// Hydrate services if state was restored
if (botState && botState.signalHistory) {
  auditLogger.hydrate(botState.signalHistory);
  executionService.hydrateProcessedSignals(botState.signalHistory);
}

// Re-initialize MetaAPI if config exists
if (botState.settings.metaApi.accountId && botState.settings.metaApi.token) {
  executionService.updateMetaApiBroker(botState.settings.metaApi);
}

const getActiveBroker = () => {
  return botState.settings.tradingMode === 'LIVE' ? (executionService as any).metaApiBroker || paperBroker : paperBroker;
};

// --- API ROUTES ---

// WEBHOOK ENDPOINT (Always Online)
app.post('/api/tradingview/webhook', async (req, res) => {
  const signal = req.body;
  console.log('[WEBHOOK] Received Signal:', signal.signal_id, signal.action);

  const result = await executionService.processSignal(botState, signal);
  
  // Update UI and history
  botState.signalHistory = auditLogger.getLogs();
  botState.isInsideTradingWindow = riskManager.isInsideTradingWindow(botState.settings);
  
  // Sync positions from active broker
  await positionManager.syncPositions(botState, getActiveBroker());
  
  saveState();

  if (result.success) {
    res.json({ success: true, status: result.status, signal_id: result.signal_id });
  } else {
    const statusCode = result.status === 'BLOCKED' && result.reason === 'INVALID_SECRET' ? 401 : 200;
    res.status(statusCode).json({ success: false, status: result.status, reason: result.reason });
  }
});

// DASHBOARD API
app.get('/api/state', async (req, res) => {
  await positionManager.syncPositions(botState, getActiveBroker());
  botState.signalHistory = auditLogger.getLogs();
  botState.isInsideTradingWindow = riskManager.isInsideTradingWindow(botState.settings);
  res.json(botState);
});

app.post('/api/settings', (req, res) => {
  const oldMode = botState.settings.tradingMode;
  botState.settings = { ...botState.settings, ...req.body };
  
  // Update MetaAPI broker if credentials changed
  if (req.body.metaApi) {
    executionService.updateMetaApiBroker(botState.settings.metaApi);
  }
  
  saveState();
  res.json({ success: true, settings: botState.settings });
});

// METAAPI TEST CONNECTION
app.post('/api/broker/test', async (req, res) => {
  const result = await executionService.testMetaApiConnection();
  if (result.success) {
    botState.settings.metaApi.connected = true;
    botState.settings.metaApi.status = 'CONNECTED';
    botState.settings.metaApi.error = undefined;
  } else {
    botState.settings.metaApi.connected = false;
    botState.settings.metaApi.status = 'ERROR';
    botState.settings.metaApi.error = result.message;
  }
  saveState();
  res.json(result);
});

// EMERGENCY ROUTES
app.post('/api/emergency/stop', (req, res) => {
  botState.settings.emergencyStop = true;
  botState.settings.tradingEnabled = false;
  saveState();
  res.json({ success: true, message: 'Emergency Stop Active' });
});

app.post('/api/emergency/close-all', async (req, res) => {
  botState.settings.emergencyStop = true;
  botState.settings.tradingEnabled = false;
  
  const result = await executionService.closeAllPositions(botState.settings.tradingMode);
  await positionManager.syncPositions(botState, getActiveBroker());
  
  saveState();
  res.json({ ...result });
});

// VITE MIDDLEWARE
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[SERVER] DaRa M1 Fresh Build v1.0 listening at http://0.0.0.0:${port}`);
});
