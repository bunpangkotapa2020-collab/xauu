const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const closeLogic = `
async function closeRealTrade(ticketId) {
  try {
    const MT5_BRIDGE_URL = process.env.MT5_BRIDGE_URL;
    const MT5_API_KEY = process.env.MT5_API_KEY;
    if (!MT5_BRIDGE_URL || !MT5_API_KEY) return false;

    let cleanBridgeUrl = MT5_BRIDGE_URL.trim().replace(/\\/+$/, '');
    if (!/^https?:\\/\\//i.test(cleanBridgeUrl)) cleanBridgeUrl = 'https://' + cleanBridgeUrl;
    
    if (cleanBridgeUrl.includes('agiliumtrade.ai') || cleanBridgeUrl.includes('metaapi.cloud')) {
      const accountsRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.ai/users/current/accounts', {
        headers: { 'auth-token': MT5_API_KEY.trim() }
      });
      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        const targetAccount = accounts.find(acc => acc.login === botState.account.loginId);
        if (targetAccount && targetAccount.connectionStatus === 'CONNECTED') {
          const tradeUrl = \`\${cleanBridgeUrl}/users/current/accounts/\${targetAccount._id}/trade\`;
          const tradeRes = await fetch(tradeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'auth-token': MT5_API_KEY.trim()
            },
            body: JSON.stringify({
              actionType: 'POSITION_CLOSE_ID',
              positionId: ticketId
            })
          });
          return tradeRes.ok;
        }
      }
    }
  } catch (err) {
    console.error('Exception in closeRealTrade:', err);
  }
  return false;
}
`;

code = code.replace(/async function openRealTrade/, closeLogic + '\nasync function openRealTrade');
fs.writeFileSync('server.ts', code);
console.log('Close trade logic added');
