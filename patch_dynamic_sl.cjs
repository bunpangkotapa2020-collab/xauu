const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /      let mitigated = false;[\s\S]*?eaState\.m15Setup = 'CONSUMED';\n  \}/m;

const replacement = `      let mitigated = false;
      if (eaState.setupSide === 'BUY' && currentAsk <= eaState.m1ObZone.high) mitigated = true;
      if (eaState.setupSide === 'SELL' && currentBid >= eaState.m1ObZone.low) mitigated = true;
      
      if (!mitigated) {
          botState.statusMessageKhmer = \`🔍 [NEW EA SMC] M1 OB Zone Confirmed — Waiting for Retracement Mitigation\`;
          return;
      }
      
      console.log(\`[NEW EA SMC] M1_RETRACE = CONFIRMED (Mitigated OB)\`);
      
      // --- DYNAMIC SL, TP, & LOT SIZING (SMC STRUCTURE) ---
      const evaluatedSignal = eaState.setupSide;
      let slPrice = 0;
      let tpPrice = 0;
      let slDistance = 0;
      let tpDistance = 0;
      
      const bufferOffset = (botState.spreadPoints / 10) * 1.5 || 2.0; // Dynamic buffer based on spread
      const entryPrice = evaluatedSignal === 'BUY' ? currentAsk : currentBid;

      if (evaluatedSignal === 'BUY') {
          slPrice = eaState.m1ObZone.low - bufferOffset;
          slDistance = entryPrice - slPrice;
          tpDistance = slDistance * 2.4; // Target RR 1:2.4
          tpPrice = entryPrice + tpDistance;
      } else {
          slPrice = eaState.m1ObZone.high + bufferOffset;
          slDistance = slPrice - entryPrice;
          tpDistance = slDistance * 2.4; // Target RR 1:2.4
          tpPrice = entryPrice - tpDistance;
      }
      
      // Safety bounds for SL distance
      if (slDistance <= 0.5) {
          console.log(\`[NEW EA SMC] FINAL_DECISION = NO TRADE (SL distance too small: \${slDistance.toFixed(2)})\`);
          resetEASetup('SL_TOO_TIGHT');
          return;
      }

      const calculatedRR = tpDistance / slDistance;
      if (calculatedRR < 2.0) {
          console.log(\`[NEW EA SMC] FINAL_DECISION = NO TRADE\`);
          console.log(\`[NEW EA SMC] REASON = RR_TOO_LOW (\${calculatedRR.toFixed(2)})\`);
          resetEASetup('RR_TOO_LOW');
          return;
      }

      // Dynamic Lot Calculation based on Risk %
      let dynamicVolume = 0.01;
      const bal = botState.account?.balance || 0;
      const riskPct = botState.riskConfig?.riskPercent || 1;
      
      if (botState.riskConfig?.lotSizeMode === 'risk_percent') {
          const maxLoss = (bal * riskPct) / 100;
          const slPipsForLot = slDistance * 10;
          dynamicVolume = Math.max(0.01, Math.min(10.0, Number((maxLoss / (slPipsForLot * 10)).toFixed(2))));
      } else {
          const p = Number(botState.riskConfig?.lotSize);
          dynamicVolume = (!isNaN(p) && p > 0) ? Number(p.toFixed(2)) : 0.01;
      }
      const volume = dynamicVolume;
      
      botState.signals = { gold: evaluatedSignal as 'BUY'|'SELL'|'WAIT' };
      
      botState.signalDetails = {
        side: evaluatedSignal as 'BUY'|'SELL',
        symbol: symbolToTrade,
        entry: entryPrice,
        lot: volume,
        sl: Number(slPrice.toFixed(2)),
        tp: Number(tpPrice.toFixed(2)),
        risk: riskPct,
        count: nextEntryNumber,
      };

      console.log(\`[NEW EA SMC] ENTRY = \${evaluatedSignal}\`);
      console.log(\`[NEW EA SMC] SL = \${slPrice.toFixed(2)}\`);
      console.log(\`[NEW EA SMC] TP = \${tpPrice.toFixed(2)}\`);
      console.log(\`[NEW EA SMC] RR = \${calculatedRR.toFixed(2)}\`);
      
      if (eaState.paperMode) {
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
          if (botState.openTrades && botState.openTrades.length >= (botState.riskConfig?.maxOpenTrades || 10)) {
              isSafe = false;
              safetyReason = \`MAX_TRADES_LIMIT_REACHED\`;
          }
          
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
          });
      }
      
      eaState.m15Setup = 'CONSUMED';
  }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Replaced Dynamic SL logic successfully.");
} else {
  console.log("Could not match the block. Exiting.");
}
