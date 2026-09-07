const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Update closeRealTrade to return boolean
const closeRealTradeRegex = /async function closeRealTrade\(tradeId: string\) \{[\s\S]*?if \(!botState\.account\.isConnected\) return;[\s\S]*?if \(res\.ok\) \{\s*console\.log\('Trade closed successfully'\);\s*\} else \{\s*console\.error\('Failed to close trade:', await res\.text\(\)\);\s*\}\s*\} catch \(e\) \{\s*console\.error\('Error closing trade:', e\.message\);\s*\}\s*\}\s*\}/;

const closeRealTradeNew = `async function closeRealTrade(tradeId: string) {
    console.log('[MetaApi] Executing real trade close for ID:', tradeId);
    if (!botState.account.isConnected) return false;

    const accountId = botState.account.metaApiAccountId;
    const token = botState.account.metaApiToken;
    const baseUrl = botState.account.metaApiUrl;

    if (baseUrl && (baseUrl.includes('agiliumtrade.ai') || baseUrl.includes('metaapi.cloud'))) {
        try {
            // MetaAPI Close Endpoint
            const res = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/positions/\${tradeId}\`, {
                method: 'DELETE',
                headers: { 'auth-token': token }
            });
            if (res.ok) {
                console.log('Trade closed successfully');
                return true;
            } else {
                console.error('Failed to close trade:', await res.text());
                return false;
            }
        } catch (e) {
            console.error('Error closing trade:', e.message);
            return false;
        }
    }
    return false;
}`;

code = code.replace(closeRealTradeRegex, closeRealTradeNew);


// 2. Update close_all logic
const closeAllRegex = /\} else if \(action === 'close_all'\) \{\s*if \(botState\.currentTrade && botState\.currentTrade\.magicNumber === botState\.magicNumber\) \{[\s\S]*?saveBotConfig\(\);\s*\} else \{\s*botState\.statusMessageKhmer = '🛑 មិនមាន Order របស់ Bot ត្រូវបិទឡើយ';\s*\}\s*\}/;

const closeAllNew = `} else if (action === 'close_all') {
      if (botState.currentTrade && botState.currentTrade.magicNumber === botState.magicNumber) {
        const closedProfit = botState.currentTrade.floatingProfit;
        const tradeId = botState.currentTrade.id;
        
        let success = true;
        if (tradeId && tradeId !== 'PENDING') {
           success = await closeRealTrade(tradeId);
        }

        if (success) {
            botState.todayProfitLoss = Number((botState.todayProfitLoss + closedProfit).toFixed(2));
            botState.account.balance = Number((botState.account.balance + closedProfit).toFixed(2));
            botState.account.equity = botState.account.balance;
            botState.todayTradeCount += 1;
            if (closedProfit >= 0) botState.todayWinCount += 1;
            else botState.todayLossCount += 1;
            botState.currentTrade = null;
            botState.statusMessageKhmer = \`🛑 បានបិទរាល់ Bot Orders ទាំងអស់ (Magic: \${botState.magicNumber}) — ចំណេញ/ខាត: \${closedProfit >= 0 ? '+' : ''}\${closedProfit} \${botState.account.currency}\`;
            saveBotConfig();
        } else {
            botState.statusMessageKhmer = '🔴 បរាជ័យក្នុងការបិទ Order (COMMAND FAILED)';
            return res.status(500).json({ error: '🔴 COMMAND FAILED - មិនអាចបញ្ជាបិទ Order លើ MT5 បានទេ!' });
        }
      } else {
        botState.statusMessageKhmer = '🛑 មិនមាន Order របស់ Bot ត្រូវបិទឡើយ';
        // Treat as success if there's nothing to close
      }
}`;

if (closeAllRegex.test(code)) {
    code = code.replace(closeAllRegex, closeAllNew);
    console.log("Replaced close_all successfully!");
} else {
    console.log("Regex for close_all did not match");
}

fs.writeFileSync('server.ts', code);
