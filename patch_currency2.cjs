const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "    currency: 'USC';",
    "    currency: string;"
);

code = code.replace(
    "    currency: 'USC' as const,",
    "    currency: 'USC',"
);

code = code.replace(
    "botState.account.currency = 'USC'; // Hardcode to USC",
    "botState.account.currency = currency;"
);

// We need to find this specific one in the /test-connection block
code = code.replace(
    "        ask: Number(ask).toFixed(2),\n        currency: 'USC',",
    "        ask: Number(ask).toFixed(2),\n        currency: currency,"
);

fs.writeFileSync('server.ts', code);
