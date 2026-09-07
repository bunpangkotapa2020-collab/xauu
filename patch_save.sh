sed -i 's/if (riskConfig.maxOpenTrades !== undefined.*$/botState.riskConfig.maxOpenTrades = 2;/' server.ts
sed -i 's/if (riskConfig.entriesPerSignal !== undefined.*$/botState.riskConfig.entriesPerSignal = 2;/' server.ts
