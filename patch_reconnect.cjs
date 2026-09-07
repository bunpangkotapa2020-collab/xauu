const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /else if \(action === 'reconnect_pipeline'\) \{[\s\S]*?saveBotConfig\(\);\s*\}/;

const replacement = `else if (action === 'reconnect_pipeline') {
      // Auto Reconnect pipeline execution with REAL VERIFICATION
      const bridgeUrl = process.env.MT5_BRIDGE_URL;
      const apiKey = process.env.MT5_API_KEY;
      if (!bridgeUrl || !apiKey || !botState.account.loginId) {
        throw new Error('🔴 មិនអាច Auto-Reconnect បានទេ៖ បាត់បង់ Credentials ឬ Login ID នៅក្នុងប្រព័ន្ធ (Backend)');
      }
      
      let bridgeConnected = false;
      let verifiedBalance = botState.account.balance;
      let verifiedEquity = botState.account.equity;
      
      try {
        let cleanBridgeUrl = bridgeUrl.trim().replace(/\\/+$/, '');
        if (!/^https?:\\/\\//i.test(cleanBridgeUrl)) cleanBridgeUrl = 'https://' + cleanBridgeUrl;
        
        if (cleanBridgeUrl.includes('agiliumtrade.ai') || cleanBridgeUrl.includes('metaapi.cloud')) {
           const accountsRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.ai/users/current/accounts', {
             headers: { 'auth-token': apiKey.trim() }
           });
           if (accountsRes.ok) {
             const accounts = await accountsRes.json();
             const targetAccount = accounts.find((acc: any) => acc.login === botState.account.loginId);
             if (targetAccount && targetAccount.state === 'DEPLOYED' && targetAccount.connectionStatus === 'CONNECTED') {
                const infoRes = await fetch(\`\${cleanBridgeUrl}/users/current/accounts/\${targetAccount._id}/account-information\`, {
                  headers: { 'auth-token': apiKey.trim() }
                });
                if (infoRes.ok) {
                   const info = await infoRes.json();
                   verifiedBalance = Number(info.balance || botState.account.balance);
                   verifiedEquity = Number(info.equity || verifiedBalance);
                   bridgeConnected = true;
                }
             }
           }
        }
        
        if (!bridgeConnected) {
           throw new Error('MetaAPI មិនទាន់ត្រៀមរួចរាល់ ឬ ដាច់ការតភ្ជាប់។');
        }
        
        botState.account.isConnected = true;
        botState.account.serverConnected = true;
        botState.account.marketDataReceiving = true;
        botState.account.tradingPermission = true;
        botState.account.eaConnected = true;
        botState.account.vpsOnline = true;
        botState.account.balance = verifiedBalance;
        botState.account.equity = verifiedEquity;
        botState.account.stages = {
          appLoggedIn: true,
          mt5AccountConfigured: true,
          exnessServerConnected: true,
          marketDataFeedLive: true,
          tradingPermissionGranted: true,
          eaLoadedAndReady: true,
        };
        botState.statusMessageKhmer = '🟢 Auto-Reconnect ជោគជ័យ — បានផ្ទៀងផ្ទាត់ Real MT5 ឡើងវិញរួចរាល់';
        saveBotConfig();
      } catch (err: any) {
         botState.account.isConnected = false;
         botState.status = 'stopped';
         saveBotConfig();
         throw new Error('🔴 Auto-Reconnect បរាជ័យ: ' + (err.message || 'Unknown error'));
      }
    }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log('Patched reconnect_pipeline');
} else {
  console.log('Regex did not match for reconnect_pipeline');
}
