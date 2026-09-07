const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetBlockStart = `      if (eaState.paperMode) {
          botState.statusMessageKhmer = \`🟢 [PAPER MODE] \${evaluatedSignal} \${symbolToTrade} (\${volume} Lot) | SMC Mitigated\`;
          console.log(\`[NEW EA SMC] FINAL_DECISION = PAPER \${evaluatedSignal}\`);
      } else {`;

const targetBlockReplace = `      if (eaState.paperMode) {
          botState.statusMessageKhmer = \`🟢 [PAPER MODE] \${evaluatedSignal} \${symbolToTrade} (\${volume} Lot) | SMC Mitigated\`;
          console.log(\`[NEW EA SMC] FINAL_DECISION = PAPER \${evaluatedSignal}\`);
      } else {
          // --- LIVE SAFETY GATE ---
          let isSafe = true;
          let safetyReason = '';
          
          if (!accountId || !token || !baseUrl) {
              isSafe = false;
              safetyReason = 'MISSING_API_CREDENTIALS';
          }
          if (volume <= 0 || isNaN(volume)) {
              isSafe = false;
              safetyReason = \`INVALID_VOLUME (\${volume})\`;
          }
          if (slPrice <= 0 || isNaN(slPrice) || tpPrice <= 0 || isNaN(tpPrice)) {
              isSafe = false;
              safetyReason = \`INVALID_SL_OR_TP (SL: \${slPrice}, TP: \${tpPrice})\`;
          }
          // Ensure valid distance
          const entryPrice = evaluatedSignal === 'BUY' ? currentAsk : currentBid;
          if (evaluatedSignal === 'BUY' && (slPrice >= entryPrice || tpPrice <= entryPrice)) {
             isSafe = false;
             safetyReason = \`INVALID_BUY_PRICES (Entry: \${entryPrice}, SL: \${slPrice}, TP: \${tpPrice})\`;
          }
          if (evaluatedSignal === 'SELL' && (slPrice <= entryPrice || tpPrice >= entryPrice)) {
             isSafe = false;
             safetyReason = \`INVALID_SELL_PRICES (Entry: \${entryPrice}, SL: \${slPrice}, TP: \${tpPrice})\`;
          }
          if (eaState.consecutiveLosses >= eaState.maxConsecutiveLosses) {
             isSafe = false;
             safetyReason = \`CONSECUTIVE_LOSS_LIMIT_REACHED\`;
          }
          if (botState.status !== 'running') {
              isSafe = false;
              safetyReason = \`BOT_NOT_RUNNING (\${botState.status})\`;
          }
          if (botState.openTrades && botState.openTrades.length >= (botState.riskConfig?.maxTrades || 10)) {
              isSafe = false;
              safetyReason = \`MAX_TRADES_LIMIT_REACHED\`;
          }
          // Basic daily loss check could also be added, but consecutive losses handles the worst case
          
          if (!isSafe) {
              console.error(\`[NEW EA SMC] 🔴 LIVE SAFETY GATE FAILED: \${safetyReason}\`);
              botState.statusMessageKhmer = \`🔴 Live Safety Block: \${safetyReason}\`;
              resetEASetup(\`SAFETY_GATE_\${safetyReason}\`);
              return;
          }

          console.log(\`[NEW EA SMC] 🟢 LIVE SAFETY GATE PASSED. SENDING ORDER TO MT5...\`);
          botState.statusMessageKhmer = \`⏳ [NEW EA SMC] Sending Real \${evaluatedSignal} Order...\`;
          
          const actionType = evaluatedSignal === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL';
          fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/trade\`, {
            method: 'POST',
            headers: { 'auth-token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actionType,
              symbol: symbolToTrade,
              volume: volume,
              stopLoss: Number(slPrice.toFixed(2)),
              takeProfit: Number(tpPrice.toFixed(2)),
              comment: \`XAU_SMC_#\${nextEntryNumber}\`,
              magic: botState.magicNumber
            })
          })
          .then(async res => {
             if (!res.ok) {
                 const errText = await res.text();
                 console.error(\`[NEW EA SMC] 🔴 MT5 ORDER REJECTED: \${res.status} \${errText}\`);
                 botState.statusMessageKhmer = \`🔴 [ERROR] MT5 Rejected Order: \${res.status}\`;
             } else {
                 const data = await res.json();
                 console.log(\`[NEW EA SMC] 🟢 REAL EXECUTION SUCCESS: Order ID \${data.orderId || 'UNKNOWN'}\`);
                 botState.statusMessageKhmer = \`🟢 [REAL EXECUTION] \${evaluatedSignal} \${symbolToTrade} (\${volume} Lot) SUCCESS\`;
             }
          })
          .catch(err => {
             console.error(\`[NEW EA SMC] 🔴 API CONNECTION ERROR DURING ORDER:\`, err);
             botState.statusMessageKhmer = \`🔴 [ERROR] API Connection Failed\`;
          });`;

const origBlockRegex = /      if \(eaState.paperMode\) \{[\s\S]*?\}\s*eaState.m15Setup = 'CONSUMED';/m;

const replacement = targetBlockReplace + "\n      }\n      \n      eaState.m15Setup = 'CONSUMED';";

if (code.match(origBlockRegex)) {
  code = code.replace(origBlockRegex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find regex");
}
