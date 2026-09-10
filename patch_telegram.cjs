const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCode = `        fetch(\`https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendMessage\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
        }).catch(err => {
            // Silently ignore telegram network errors so they don't spam the console
            // console.error('Telegram Fetch Error:', err.message);
        });`;

const newCode = `        fetch(\`https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendMessage\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
        }).then(res => {
            if (!res.ok) {
                console.error(\`Telegram API Error: \${res.status} \${res.statusText} (Check Token/Chat ID)\`);
            }
        }).catch(err => {
            // Suppress noisy fetch failed (DNS/Network drops) but log other errors
            if (err.message && err.message.toLowerCase().includes('fetch failed')) {
                // Silently ignore transient network drops
            } else {
                console.error('Telegram Fetch Error:', err.message);
            }
        });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('server.ts', code);
console.log('Patched server.ts');
