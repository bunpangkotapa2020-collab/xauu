const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newTradeLogic = `
async function openRealTrade(side) {
  try {
    const MT5_BRIDGE_URL = process.env.MT5_BRIDGE_URL;
    const MT5_API_KEY = process.env.MT5_API_KEY;
    if (!MT5_BRIDGE_URL || !MT5_API_KEY) {
      console.error('Missing MetaApi Credentials');
      return false;
    }

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
          const lot = botState.riskConfig.lotSize || 0.01;
          const tradeRes = await fetch(tradeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'auth-token': MT5_API_KEY.trim()
            },
            body: JSON.stringify({
              actionType: side === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
              symbol: 'XAUUSD',
              volume: Number(lot),
              magic: botState.magicNumber,
              comment: 'XAUUSD_AI'
            })
          });
          if (tradeRes.ok) {
            const result = await tradeRes.json();
            console.log('Real Trade Opened:', result);
            return result;
          } else {
             const errorData = await tradeRes.text();
             console.error('Trade Error from MetaApi:', errorData);
          }
        }
      }
    }
  } catch (err) {
    console.error('Exception in openRealTrade:', err);
  }
  return false;
}
`;

code = code.replace(/setInterval\(\(\) => \{/, newTradeLogic + '\nsetInterval(() => {');
fs.writeFileSync('server.ts', code);
console.log('Trade logic added to server');
