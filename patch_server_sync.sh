sed -i 's/maxOpenTrades: Number(rc.maxOpenTrades !== undefined && !isNaN(Number(rc.maxOpenTrades)) ? rc.maxOpenTrades : 2),/maxOpenTrades: 2,/' server.ts
