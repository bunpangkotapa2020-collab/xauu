sed -i -e '/res.json({/i \
    if (global.daraEngine) {\
      botState.signalDetails = botState.signalDetails || {};\
      botState.signalDetails.daraSetup = global.daraEngine.getCurrentSetup();\
      botState.signalDetails.daraTelemetry = global.daraEngine.getTelemetry(\
        botState.goldPrice && botState.account.marketDataReceiving ? botState.goldPrice.spread : 0,\
        botState.openTrades ? botState.openTrades.length : 0\
      );\
      botState.signalDetails.daraSafety = global.daraEngine.evaluateSafety(\
        botState.goldPrice && botState.account.marketDataReceiving ? botState.goldPrice.spread : 0,\
        botState.openTrades ? botState.openTrades.length : 0\
      );\
    }
' server.ts
bash patch_server.sh