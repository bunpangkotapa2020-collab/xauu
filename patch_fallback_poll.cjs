const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `botState.statusMessageKhmer = '🔴 CONNECTION LOST - មិនអាចទាក់ទង MT5 Bridge Server បានទេ';
        }
    }
}, 3000);`;

const replacement = `botState.statusMessageKhmer = '🔴 CONNECTION LOST - មិនអាចទាក់ទង MT5 Bridge Server បានទេ';
        }
    } else if (baseUrl) {
        // Fallback for custom proprietary REST Bridge
        try {
            const bridgeRes = await fetch(\`\${baseUrl}/account\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                body: JSON.stringify({ server: botState.account.server, login: botState.account.loginId, password: process.env.MT5_PASSWORD })
            }).catch(() => null);
            
            if (bridgeRes && bridgeRes.ok) {
                const data = await bridgeRes.json();
                botState.account.balance = Number(data.balance || botState.account.balance);
                botState.account.equity = Number(data.equity || botState.account.equity);
                botState.account.freeMargin = Number(data.freeMargin || botState.account.freeMargin);
                botState.account.serverConnected = true;
                botState.account.marketDataReceiving = true;
            } else {
                botState.account.serverConnected = false;
                botState.account.marketDataReceiving = false;
                botState.statusMessageKhmer = '🔴 CONNECTION LOST - Custom Bridge Offline';
            }
        } catch (e) {
            botState.account.serverConnected = false;
            botState.account.marketDataReceiving = false;
        }
    }
}, 3000);`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log('patched generic fallback poll');
} else {
    console.log('could not find target in server.ts');
}
