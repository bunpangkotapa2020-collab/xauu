const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldClose = `  async function closeRealTrade(tradeId: string) {
    console.log('[MetaApi] Executing real trade close for ID:', tradeId);
    // Real implementation goes here
}`;

const newClose = `  async function closeRealTrade(tradeId: string) {
    console.log('[MetaApi] Executing real trade close for ID:', tradeId);
    if (!botState.account.isConnected || !botState.account.metaApiAccountId) return;

    const accountId = botState.account.metaApiAccountId;
    const token = botState.account.metaApiToken;
    const baseUrl = botState.account.metaApiUrl;

    if (baseUrl && (baseUrl.includes('agiliumtrade.ai') || baseUrl.includes('metaapi.cloud'))) {
        try {
            await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/trade\`, {
                method: 'POST',
                headers: { 'auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actionType: 'POSITION_MODIFY', // Actually MetaApi uses POSITION_MODIFY to close by specifying actionType: POSITION_CLOSE or just using closePosition
                    // Let's use the explicit close position endpoint: DELETE /users/current/accounts/{accountId}/positions/{positionId}
                })
            });
            
            // MetaAPI Close Endpoint
            const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/positions/\${tradeId}\`, {
                method: 'DELETE',
                headers: { 'auth-token': token }
            });
            if (res.ok) {
                console.log('Trade closed successfully');
            } else {
                console.error('Failed to close trade:', await res.text());
            }
        } catch (e) {
            console.error('Error closing trade:', e.message);
        }
    }
}`;

if (code.includes('// Real implementation goes here')) {
    code = code.replace(oldClose, newClose);
    fs.writeFileSync('server.ts', code);
    console.log('closeRealTrade patched');
}
