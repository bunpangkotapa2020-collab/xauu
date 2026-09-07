const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

// 1. We need to import DaRa components at the top.
const importsToInject = `
import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine.js';
import { DaRaBrokerInterface, DaRaTelegramInterface, DaRaUserSettings } from './src/engines/dara_m1/types.js';
`;

if (!code.includes('DaRaM1Engine.js')) {
    code = code.replace(
        "import { IctXauusdEA, EAConfig } from './src/MASTER_ICT_EA.js';",
        importsToInject + "\nimport { IctXauusdEA, EAConfig } from './src/MASTER_ICT_EA.js';"
    );
}

// 2. We need to implement DaRaBrokerInterface and DaRaTelegramInterface
// and instantiate DaRaM1Engine instead of IctXauusdEA.
// Let's find the line: const ictEaEngine = new IctXauusdEA(...);

const daraIntegrationBlock = `
// ============================================
// 🔥 DaRa M1 EA v1.0 INTEGRATION
// ============================================

class DaRaServerBroker implements DaRaBrokerInterface {
    async sendOrder(order) {
        console.log(\`[DaRa Broker] Executing \${order.type} for \${order.lot} lot...\`);
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        
        if (!accountId || !token || !baseUrl) {
             return { success: false, error: "MetaApi not connected" };
        }
        
        const requestBody = {
            actionType: order.type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
            symbol: order.symbol,
            volume: order.lot,
            stopLoss: order.sl,
            takeProfit: order.tp,
            comment: order.comment
        };
        
        try {
            const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/trade\`, {
                method: 'POST',
                headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const responseText = await res.text();
            if (!res.ok) {
                return { success: false, error: \`HTTP \${res.status} - \${responseText}\` };
            }
            const data = JSON.parse(responseText);
            return { success: true, ticket: data.orderId || data.positionId || 'UNKNOWN' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async modifyPosition(ticket, newSl, newTp) {
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        
        if (!accountId || !token || !baseUrl) return { success: false, error: "MetaApi not connected" };
        
        const modifyPayload = {
             actionType: 'POSITION_MODIFY',
             positionId: ticket,
             stopLoss: newSl
        };
        if (newTp !== undefined) modifyPayload.takeProfit = newTp;
        
        try {
             const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/trade\`, {
                 method: 'POST',
                 headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                 body: JSON.stringify(modifyPayload)
             });
             const responseText = await res.text();
             if (!res.ok) {
                 return { success: false, error: \`HTTP \${res.status} - \${responseText}\` };
             }
             return { success: true };
        } catch (err) {
             return { success: false, error: err.message };
        }
    }

    async getOpenPositions(symbol) {
        return (botState.openTrades || []).filter(t => t.symbol === symbol).map(t => ({
            ticket: String(t.id),
            symbol: t.symbol,
            type: t.side,
            lot: t.volume,
            openPrice: t.entryPrice,
            currentPrice: t.currentPrice,
            sl: t.stopLoss || 0,
            tp: t.takeProfit || 0,
            openTime: new Date(t.openTime).getTime()
        }));
    }

    async getSymbolInfo(symbol) {
        const accountId = botState.account.metaApiAccountId;
        const token = botState.account.metaApiToken;
        const baseUrl = botState.account.metaApiUrl;
        if (!accountId || !token || !baseUrl) return { pointSize: 0.01 };
        
        try {
            const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/symbols/\${symbol}/specification\`, {
                headers: { 'auth-token': token }
            });
            if (res.ok) {
                const spec = await res.json();
                return { pointSize: spec.pointSize || spec.point || 0.01 };
            }
        } catch (e) {
            console.error('[DaRa Broker] Failed to fetch symbol info:', e);
        }
        return { pointSize: 0.01 };
    }
}

class DaRaServerTelegram implements DaRaTelegramInterface {
    async notify(title, message) {
        // We can hook this to sendTelegramMessage(botState.userPreferences?.telegramChatId, message)
        // Since sendTelegramMessage is already defined globally in server.ts
        if (typeof global.sendTelegramMessage === 'function') {
            global.sendTelegramMessage(message).catch(() => {});
        } else {
            console.log(\`[DaRa Telegram] \${title}\n\${message}\`);
        }
    }
}

const daraBroker = new DaRaServerBroker();
const daraTelegram = new DaRaServerTelegram();
const daraEngine = new DaRaM1Engine(daraBroker, daraTelegram);

// Replace ictEaEngine references with a proxy/wrapper or just use daraEngine directly.
// The prompt asked to completely remove IctXauusdEA.

`;

const targetBlock = 'const ictEaEngine = new IctXauusdEA(ictEaConfig, ictNewsProvider, new RealMetaApiExecution());';

if (code.includes(targetBlock) && !code.includes('DaRaServerBroker')) {
    code = code.replace(targetBlock, targetBlock + "\n\n" + daraIntegrationBlock);
}

fs.writeFileSync('server.ts.dara_patch1', code);
console.log('Patch 1 generated');
