input string   InpServerUrl         = "${syncUrl}"; // Web Cloud Sync URL

input group "=== [2] RISK MANAGEMENT (NO MARTINGALE / NO GRID) ==="
input double   InpLotSize           = 0.01;                     // Fixed Lot Size (0.01 - 0.10)
input int      InpMaxOpenTrades     = 4;                        // Max Open Bot Trades per Cycle
input int      InpStopLossPips      = 25;                       // Mandatory Stop Loss (Pips)
input int      InpTakeProfitPips    = 35;                       // Take Profit (Pips)
input double   InpMaxDailyLoss   = 50.0;                     // Max Daily Loss Limit ($ / USC)
input int      InpMaxSpread         = 27;                       // Max Spread Allowed (Points)

input group "=== [3] TRADING HOURS FILTER ==="
input bool     InpUseTradingHours   = true;                     // Enable Trading Hours
input int      InpStartHour         = 8;                        // Start Hour (0-23)
input int      InpStopHour          = 22;                       // Stop Hour (0-23)

//--- Global Variables
datetime glLastTradeDate = 0;
double   glDailyStartEquity = 0;
datetime glLastSyncTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   trade.SetExpertMagicNumber(InpMagicNumber);
   Print("=== XAUUSD AI Scalping Bot Initialized Successfully ===");
   Print("Magic Number: ", InpMagicNumber, " | Server URL: ", InpServerUrl);
   glDailyStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   EventSetTimer(1); // 1-second continuous background sync
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
  }

//+------------------------------------------------------------------+
//| Expert timer function (Continuous Heartbeat & Sync)              |
//+------------------------------------------------------------------+
void OnTimer()
  {
   SyncWithBackend();
  }

//+------------------------------------------------------------------+
//| Check Daily Loss Limit                                           |
//+------------------------------------------------------------------+
bool IsDailyLossHit()
  {
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   if((glDailyStartEquity - currentEquity) >= InpMaxDailyLoss)
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
//| Count Active Bot Orders (Filtered by Magic Number)               |
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
//| Close SINGLE Bot Position (Only if Magic Number matches)         |
//+------------------------------------------------------------------+
bool CloseSingleBotPosition(ulong targetTicket)
  {
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == targetTicket)
        {
         if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
           {
            bool res = trade.PositionClose(ticket);
            if(res) {
               Print("\u{1F6E1}\uFE0F Successfully Closed Single Bot Position Ticket: ", ticket);
               return true;
            } else {
               Print("\u26A0\uFE0F Failed to close Bot Position Ticket: ", ticket, " Error: ", GetLastError());
               return false;
            }
           }
         else
           {
            Print("\u{1F6E1}\uFE0F ISOLATION PROTECTED: Ticket ", ticket, " is a Manual Trade (Magic: ", PositionGetInteger(POSITION_MAGIC), "). Skipping!");
            return false;
           }
        }
     }
   return false;
  }

//+------------------------------------------------------------------+
//| Close ONLY Bot Positions (Protected by Magic Number)              |
//+------------------------------------------------------------------+
void CloseAllBotPositions()
  {
   int closed = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
        {
         if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
           {
            if(trade.PositionClose(ticket)) {
               closed++;
               Print("\u{1F6E1}\uFE0F Closed Bot Position Ticket: ", ticket, " (Magic: ", InpMagicNumber, ")");
            }
           }
         else
           {
            Print("\u{1F6E1}\uFE0F Manual Trade Ticket #", ticket, " (Magic: ", PositionGetInteger(POSITION_MAGIC), ") is 100% PROTECTED!");
           }
        }
     }
   Print("=== Closed Total ", closed, " Bot Positions (Manual Trades Untouched) ===");
  }

//+------------------------------------------------------------------+
//| WebRequest to Node.js Backend                                    |
//+------------------------------------------------------------------+
void SyncWithBackend()
  {
   if(TimeCurrent() - glLastSyncTime < 2) return; // Sync every 2 seconds
   glLastSyncTime = TimeCurrent();

   string cookie = NULL, headers;
   char post[], result[];
   
   // Collect Account Data
   string accLogin = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   string accServer = AccountInfoString(ACCOUNT_SERVER);
   string accBalance = DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2);
   string accEquity = DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2);
   string accFreeMargin = DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2);
   string algoAllowed = (TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) && MQLInfoInteger(MQL_TRADE_ALLOWED)) ? "true" : "false";
   
   // Collect Market Data
   string sym = _Symbol;
   if(sym == "") sym = "XAUUSD";
   string xauBid = DoubleToString(SymbolInfoDouble(sym, SYMBOL_BID), 2);
   string xauAsk = DoubleToString(SymbolInfoDouble(sym, SYMBOL_ASK), 2);
   string spread = IntegerToString(SymbolInfoInteger(sym, SYMBOL_SPREAD));
   
   // Collect Positions Array JSON
   string posJson = "[";
   int posCount = 0;
   for(int p = 0; p < PositionsTotal(); p++)
     {
      ulong tkt = PositionGetTicket(p);
      if(tkt > 0)
        {
         if(posCount > 0) posJson += ",";
         posJson += "{";
         posJson += "\\"ticket\\":\\"" + IntegerToString(tkt) + "\\",";
         posJson += "\\"magic\\":" + IntegerToString(PositionGetInteger(POSITION_MAGIC)) + ",";
         posJson += "\\"type\\":\\"" + (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL") + "\\",";
         posJson += "\\"volume\\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
         posJson += "\\"openPrice\\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 2) + ",";
         posJson += "\\"currentPrice\\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_CURRENT), 2) + ",";
         posJson += "\\"profit\\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",";
         posJson += "\\"sl\\":" + DoubleToString(PositionGetDouble(POSITION_SL), 2) + ",";
         posJson += "\\"tp\\":" + DoubleToString(PositionGetDouble(POSITION_TP), 2);
         posJson += "}";
         posCount++;
        }
     }
   posJson += "]";

   // JSON Payload
   string json = "{";
   json += "\\"accountLogin\\":\\"" + accLogin + "\\",";
   json += "\\"server\\":\\"" + accServer + "\\",";
   json += "\\"balance\\":" + accBalance + ",";
   json += "\\"equity\\":" + accEquity + ",";
   json += "\\"freeMargin\\":" + accFreeMargin + ",";
   json += "\\"goldBid\\":" + xauBid + ",";
   json += "\\"goldAsk\\":" + xauAsk + ",";
   json += "\\"spread\\":" + spread + ",";
   json += "\\"algoAllowed\\":" + algoAllowed + ",";
   json += "\\"magicNumber\\":" + IntegerToString(InpMagicNumber) + ",";
   json += "\\"positions\\":" + posJson;
   json += "}";
   
   StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8);
   
   int res = WebRequest("POST", InpServerUrl, "Content-Type: application/json\\r
", 3000, post, result, headers);
   
   if(res == 200) {
      string responseText = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      // Check if command is close_all
      if(StringFind(responseText, "\\"closeAllBot\\":true") >= 0) {
         Print("\u26A1 Received CLOSE ALL BOT TRADES command from Web Dashboard!");
         CloseAllBotPositions();
      }
      // Check if single close tickets requested
      int idxTickets = StringFind(responseText, "\\"closeTickets\\":[");
      if(idxTickets >= 0) {
         int start = idxTickets + 16;
         int end = StringFind(responseText, "]", start);
         if(end > start) {
            string tktsStr = StringSubstr(responseText, start, end - start);
            string arr[];
            int totalTkts = StringSplit(tktsStr, ',', arr);
            for(int k = 0; k < totalTkts; k++) {
               string item = arr[k];
               StringReplace(item, "\\"", "");
               StringReplace(item, " ", "");
               ulong tkt = (ulong)StringToInteger(item);
               if(tkt > 0) {
                  Print("\u26A1 Received Single CLOSE Request for Ticket: ", tkt);
                  CloseSingleBotPosition(tkt);
               }
            }
         }
      }

      // EXECUTION BLOCK REMOVED: MQL5 EA is now strictly DATA/HEARTBEAT ONLY.
   } else {
      Print("\u26A0\uFE0F WebRequest failed. Please add ", InpServerUrl, " in MT5 Tools -> Options -> Expert Advisors -> Allow WebRequest");
   }
  }

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
   // 1. Sync Live Account & Price Data with Web App
   SyncWithBackend();
   
   // 2. Check Symbol (Support XAUUSD, XAUUSDc, XAUUSDm, GOLD, etc.)
   if(StringFind(_Symbol, "XAU") < 0 && StringFind(_Symbol, "GOLD") < 0) return;

   // 3. Check Spread
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > InpMaxSpread) {
      Comment("\u26A0\uFE0F Spread \u1792\u17C6\u1796\u17C1\u1780 (Spread: ", spread, " > ", InpMaxSpread, ")");
      return;
   }

   // 4. Check Daily Loss Limit
   if(IsDailyLossHit())
     {
      Comment("\u{1F6D1} \u178A\u179B\u17CB\u1780\u1798\u17D2\u179A\u17B7\u178F\u1781\u17B6\u178F\u1794\u17D2\u179A\u1785\u17B6\u17C6\u1790\u17D2\u1784\u17C3 (Daily Loss Limit Hit) - Stopped New Trades");
      return;
     }

   // 5. Check Trading Hours
   if(!IsInsideTradingHours())
     {
      Comment("\u23F8\uFE0F \u1780\u17D2\u179A\u17C5\u1798\u17C9\u17C4\u1784\u1787\u17BD\u1789\u178A\u17BC\u179A (Outside Trading Hours: ", InpStartHour, ":00 - ", InpStopHour, ":00)");
      return;
     }

   // 6. Max Open Positions Check
   int openCount = CountBotPositions();
   if(openCount >= InpMaxOpenTrades)
     {
      Comment("\u{1F7E2} \u1780\u17C6\u1796\u17BB\u1784\u1782\u17D2\u179A\u1794\u17CB\u1782\u17D2\u179A\u1784 Trade \u179F\u1780\u1798\u17D2\u1798 (Active Trades: ", openCount, "/", InpMaxOpenTrades, " | Magic: ", InpMagicNumber, ")");
      return;
     }

   Comment("\u{1F7E2} XAUUSD AI Scalping Bot: Ready (AI 1-Min Interval Active | Open: ", openCount, "/", InpMaxOpenTrades, ")");
  }
//+------------------------------------------------------------------+
`;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", 'attachment; filename="XAUUSD_AI_Scalping_v3.mq5"');
    res.send(mq5Code);
  });
  app.get("/api/bot/download/preset", (req, res) => {
    const setFileContent = `; XAUUSD AI Scalping Bot - Exness Cent / Standard Preset
; Final Simple Version
InpMagicNumber=778899
InpTradeComment=XAUUSD_AI
InpLotSize=0.01
InpMaxOpenTrades=4
InpStopLossPips=25
InpTakeProfitPips=35
InpMaxDailyLoss=50.0
InpMaxSpread=27
InpUseTradingHours=true
InpStartHour=8
InpStopHour=22
`;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", 'attachment; filename="XAUUSD_Scalping_Preset.set"');
    res.send(setFileContent);
  });
  app.get("/api/bot/download/shortcut-windows", (req, res) => {
    const proto = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host || "localhost:3000";
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
    res.setHeader("Content-Type", "application/internet-shortcut");
    res.setHeader("Content-Disposition", 'attachment; filename="XAUUSD_AI_Scalping_Bot.url"');
    res.send(urlContent);
  });
  app.get("/api/bot/download/shortcut-linux", (req, res) => {
    const proto = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host || "localhost:3000";
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
    res.setHeader("Content-Type", "application/x-desktop");
    res.setHeader("Content-Disposition", 'attachment; filename="XAUUSD_AI_Scalping_Bot.desktop"');
    res.send(desktopContent);
  });
  app.get("/api/bot/download/dara-package", (req, res) => {
    const pkgPath = import_path.default.join(process.cwd(), "public", "dara-files.tar.gz");
    res.download(pkgPath, "dara-files.tar.gz");
  });
  app.get("/dara_m1_update.tar.gz", (req, res) => {
    const pkgPath = import_path.default.join(process.cwd(), "dara_m1_update.tar.gz");
    res.download(pkgPath, "dara_m1_update.tar.gz");
  });
  app.get("/download/dara_m1_update.tar.gz", (req, res) => {
    const pkgPath = import_path.default.join(process.cwd(), "dara_m1_update.tar.gz");
    res.download(pkgPath, "dara_m1_update.tar.gz");
  });
  app.get("/api/bot/download/dara_m1_update.tar.gz", (req, res) => {
    const pkgPath = import_path.default.join(process.cwd(), "dara_m1_update.tar.gz");
    res.download(pkgPath, "dara_m1_update.tar.gz");
  });
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await (0, import_vite.createServer)({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.log("[Server] Running in Headless/API Mode (Vite skipped):", viteErr?.message || viteErr);
      const distPath = import_path.default.join(process.cwd(), "dist");
      app.use(import_express.default.static(distPath));
      app.use(import_express.default.static(import_path.default.join(process.cwd(), "public")));
      app.get("*", (req, res) => {
        const fallbackIndex = import_path.default.join(distPath, "index.html");
        if (import_fs.default.existsSync(fallbackIndex)) {
          res.sendFile(fallbackIndex);
        } else {
          res.send("<h1>DaRa M1 EA Server is Online</h1><p>Status: Active | Port: 3000</p>");
        }
      });
    }
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      const fallbackIndex = import_path.default.join(distPath, "index.html");
      if (import_fs.default.existsSync(fallbackIndex)) {
        res.sendFile(fallbackIndex);
      } else {
        res.send("<h1>DaRa M1 EA Server is Online</h1><p>Status: Active | Port: 3000</p>");
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[XAUUSD AI Scalping Bot Server] running on http://0.0.0.0:${PORT}`);
    setTimeout(() => {
      const lastHealth = getHealthState();
      if (lastHealth.cleanShutdown) {
        sendTelegramRaw("\u{1F7E2} DaRa M1 EA \u2014 BOT ONLINE\nBot \u1780\u17C6\u1796\u17BB\u1784\u178A\u17C6\u178E\u17BE\u179A\u1780\u17B6\u179A 24/7", "BOT_ONLINE", 0);
      } else {
        sendTelegramRaw("\u{1F7E2} DaRa M1 EA \u2014 BOT RESTORED\nBot \u1794\u17B6\u1793\u178A\u17C6\u178E\u17BE\u179A\u1780\u17B6\u179A\u17A1\u17BE\u1784\u179C\u17B7\u1789\u17D4", "BOT_RESTORED", 0);
      }
      setHealthState(false);
    }, 1e4);
  });
}
var HEALTH_STATE_FILE = import_path.default.join(DATA_DIR, "bot_health.json");
var botHealthShuttingDown = false;
var currentMt5State = "UNKNOWN";
function getHealthState() {
  try {
    if (import_fs.default.existsSync(HEALTH_STATE_FILE)) return JSON.parse(import_fs.default.readFileSync(HEALTH_STATE_FILE, "utf8"));
  } catch (e) {
  }
  return { cleanShutdown: true };
}
function setHealthState(clean) {
  try {
    import_fs.default.writeFileSync(HEALTH_STATE_FILE, JSON.stringify({ cleanShutdown: clean }));
  } catch (e) {
  }
}
async function handleBotOffline(reason) {
  if (botHealthShuttingDown) return;
  botHealthShuttingDown = true;
  setHealthState(reason === "CLEAN");
  const msg = reason === "CLEAN" ? "\u{1F534} DaRa M1 EA \u2014 BOT OFFLINE\nBot \u1794\u17B6\u1793\u1788\u1794\u17CB\u178A\u17C6\u178E\u17BE\u179A\u1780\u17B6\u179A\u17D4 \u179F\u17BC\u1798\u1796\u17B7\u1793\u17B7\u178F\u17D2\u1799 VPS/PM2\u17D4" : "\u{1F534} DaRa M1 EA \u2014 BOT OFFLINE (CRASH)\nBot \u1794\u17B6\u1793\u1788\u1794\u17CB\u178A\u17C6\u178E\u17BE\u179A\u1780\u17B6\u179A\u178A\u17C4\u1799\u179F\u17B6\u179A Error\u17D4 \u179F\u17BC\u1798\u1796\u17B7\u1793\u17B7\u178F\u17D2\u1799 VPS/PM2 \u1787\u17B6\u1794\u1793\u17D2\u1791\u17B6\u1793\u17CB\u17D4";
  try {
    await sendTelegramRaw(msg, "BOT_OFFLINE", 0);
    await new Promise((res) => setTimeout(res, 2e3));
  } catch (e) {
  }
}
process.on("SIGINT", async () => {
  await handleBotOffline("CLEAN");
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await handleBotOffline("CLEAN");
  process.exit(0);
});
process.on("uncaughtException", async (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  await handleBotOffline("CRASH");
  process.exit(1);
});
startServer();
setInterval(() => {
  const lastSeen = Math.max(botState.lastTickTime || 0, lastSyncTimestamp || 0, lastMetaApiSuccessTime || 0);
  const isRecentlyActive = lastSeen > 0 && Date.now() - lastSeen < 6e4;
  if (isRecentlyActive) {
    botState.account.isConnected = true;
    botState.account.serverConnected = true;
    botState.account.eaConnected = true;
    botState.account.vpsOnline = true;
    botState.account.marketDataReceiving = true;
    if (currentMt5State === "LOST") {
      currentMt5State = "CONNECTED";
      sendTelegramRaw("\u{1F7E2} DaRa M1 \u2014 CONNECTION RESTORED\nEA \u1780\u17C6\u1796\u17BB\u1784\u1797\u17D2\u1787\u17B6\u1794\u17CB\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799 MetaApi Cloud \u17A1\u17BE\u1784\u179C\u17B7\u1789\u17D4", "MT5_CONN_RESTORED", 0);
    } else if (currentMt5State === "UNKNOWN") {
      currentMt5State = "CONNECTED";
    }
    if (!botState.marketDataStatus || botState.marketDataStatus.includes("\u{1F534}")) {
      botState.marketDataStatus = "\u{1F7E2} LIVE (METAAPI CLOUD ACTIVE)";
    }
  } else if (lastSeen > 0 && Date.now() - lastSeen >= 6e4) {
    if (consecutivePollingFailures > 0 || !botState.account.loginId) {
      botState.account.serverConnected = false;
      botState.account.eaConnected = false;
    }
    botState.account.marketDataReceiving = false;
    if (currentMt5State !== "LOST") {
      currentMt5State = "LOST";
      sendTelegramRaw("\u{1F534} DaRa M1 \u2014 MARKET DATA DISCONNECTED\n\u1794\u17B6\u178F\u17CB\u1780\u17B6\u179A\u178F\u1797\u17D2\u1787\u17B6\u1794\u17CB\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1795\u17D2\u179F\u17B6\u179A\u179B\u17BE\u179F\u1796\u17B8 60s\u17D4", "MT5_CONN_LOST", 0);
    }
    const tickAgeMs = Date.now() - (botState.lastTickTime || 0);
    const ageText = botState.lastTickTime ? `${Math.floor(tickAgeMs / 1e3)}s` : "No Data";
    botState.marketDataStatus = `\u{1F534} MARKET DATA DISCONNECTED (Delay: ${ageText})`;
    console.log(`[MARKET_DATA] connection=DISCONNECTED lastTickTime=${botState.lastTickTime} tickAgeMs=${tickAgeMs} bid=${botState.bidPrice} ask=${botState.askPrice} dataFresh=false`);
  } else if (!botState.account.isConnected) {
    botState.marketDataStatus = "WATCHING / WAITING FOR DATA";
  }
  SelfHealingEngine.checkConnectionState(botState.account.serverConnected);
}, 3e3);
//# sourceMappingURL=server.cjs.map
