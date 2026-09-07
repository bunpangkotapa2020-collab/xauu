const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const oldErrorThrow = `if (!response.ok) {
                throw new Error(\`History API failed: \${response.status}\`);
            }`;

const newErrorThrow = `if (!response.ok) {
                if (response.status === 504 || response.status === 502 || response.status === 503) {
                    console.warn(\`[DaRa M1 EA] P/L Sync Warning: MetaApi Gateway Timeout/Error (\${response.status}). Retrying later.\`);
                    isSyncingPnL = false;
                    return; // Fail gracefully, don't throw to avoid spamming error logs
                }
                throw new Error(\`History API failed: \${response.status}\`);
            }`;

content = content.replace(oldErrorThrow, newErrorThrow);
fs.writeFileSync('server.ts', content, 'utf8');
console.log('Patched 504 error handling in server.ts');
