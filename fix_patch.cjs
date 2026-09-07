const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Revert the wrong one
code = code.replace(`
        if (currentMt5State !== 'LOST') {
            currentMt5State = 'LOST';
            sendTelegramRaw('🔴 DaRa M1 — MT5 CONNECTION LOST\\nEA បាត់ការតភ្ជាប់ជាមួយ MT5។', 'MT5_CONN_LOST', 0);
        }
        const tickAgeMs = Date.now() - (botState.lastTickTime || 0);`,
        `const tickAgeMs = Date.now() - (botState.lastTickTime || 0);`);

// Apply to the correct one at the end of the file
const correctTarget = `botState.account.marketDataReceiving = false;
        const tickAgeMs = Date.now() - (botState.lastTickTime || 0);`;

const correctReplacement = `botState.account.marketDataReceiving = false;
        if (currentMt5State !== 'LOST') {
            currentMt5State = 'LOST';
            sendTelegramRaw('🔴 DaRa M1 — MT5 CONNECTION LOST\\nEA បាត់ការតភ្ជាប់ជាមួយ MT5។', 'MT5_CONN_LOST', 0);
        }
        const tickAgeMs = Date.now() - (botState.lastTickTime || 0);`;

code = code.replace(correctTarget, correctReplacement);

fs.writeFileSync('server.ts', code);
console.log('PATCH FIXED');
