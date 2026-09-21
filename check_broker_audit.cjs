
const fs = require('fs');
const https = require('https');

function httpsGet(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'auth-token': token }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse JSON: ' + data.substring(0, 100)));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function checkBroker() {
  try {
    const config = JSON.parse(fs.readFileSync('./data/bot_config.json', 'utf8'));
    const token = config.account.metaApiToken;
    const baseUrl = config.account.metaApiUrl || 'https://mt-client-api-v1.backup-new-york.agiliumtrade.ai';
    const accountId = config.account.metaApiAccountId;

    console.log('Querying MetaApi for Account:', accountId);
    
    console.log('--- ACTUAL BROKER POSITIONS ---');
    const positions = await httpsGet(`${baseUrl}/users/current/accounts/${accountId}/positions`, token);
    console.log(JSON.stringify(positions, null, 2));
    
    // Correct format: /history-deals/time/:startTime/:endTime
    const now = new Date();
    const yesterday = new Date(now.getTime() - 48*60*60*1000);
    const encStart = encodeURIComponent(yesterday.toISOString());
    const encEnd = encodeURIComponent(now.toISOString());
    
    console.log('--- ACTUAL BROKER HISTORY DEALS (LAST 48H) ---');
    try {
      const historyUrl = `${baseUrl}/users/current/accounts/${accountId}/history-deals/time/${encStart}/${encEnd}`;
      console.log('URL:', historyUrl);
      const history = await httpsGet(historyUrl, token);
      console.log(JSON.stringify(history, null, 2));
    } catch (e) {
      console.log('History Deals failed:', e.message);
    }

  } catch (err) {
    console.error('Error querying MetaApi:', err.message);
  }
}

checkBroker();
