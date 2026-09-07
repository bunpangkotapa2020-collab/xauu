sed -i 's/maxOpenTrades: Number(rc.maxOpenTrades !== undefined && !isNaN(Number(rc.maxOpenTrades)) ? rc.maxOpenTrades : initialSettings.maxOpenTrades),/maxOpenTrades: 2,/' server.ts
