const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We need to implement actual trade execution in the backend!
// Wait, MetaApi trading endpoint requires accountId. We don't store accountId in botState, but we can query it using loginId and server.

const executeTradeLogic = `
async function executeRealTrade(side, lot) {
  const MT5_BRIDGE_URL = process.env.MT5_BRIDGE_URL;
  const MT5_API_KEY = process.env.MT5_API_KEY;
  if (!MT5_BRIDGE_URL || !MT5_API_KEY) throw new Error('Missing MetaApi Credentials');

  let cleanBridgeUrl = MT5_BRIDGE_URL.trim().replace(/\\/+$/, '');
  if (!/^https?:\\/\\//i.test(cleanBridgeUrl)) cleanBridgeUrl = 'https://' + cleanBridgeUrl;
  
  // Get Account ID
  const accountsRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.ai/users/current/accounts', {
    headers: { 'auth-token': MT5_API_KEY.trim() }
  });
  if (!accountsRes.ok) throw new Error('Failed to fetch MetaApi accounts');
  const accounts = await accountsRes.json();
  const targetAccount = accounts.find(acc => acc.login === botState.account.loginId);
  
  if (!targetAccount || targetAccount.connectionStatus !== 'CONNECTED') {
    throw new Error('Account is not connected to MetaApi');
  }

  // Execute Trade
  const tradeUrl = \`\${cleanBridgeUrl}/users/current/accounts/\${targetAccount._id}/trade\`;
  const tradeRes = await fetch(tradeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'auth-token': MT5_API_KEY.trim()
    },
    body: JSON.stringify({
      actionType: 'ORDER_TYPE_' + side.toUpperCase(),
      symbol: 'XAUUSD',
      volume: Number(lot)
    })
  });
  
  if (!tradeRes.ok) {
    const errData = await tradeRes.text();
    throw new Error('MT5 Trade Failed: ' + errData);
  }
  
  return await tradeRes.json();
}
`;
