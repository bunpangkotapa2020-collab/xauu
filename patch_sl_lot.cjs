const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
      // --- DYNAMIC SL, TP, & LOT SIZING (SMC STRUCTURE) ---
      const evaluatedSignal = eaState.setupSide;
      let slPrice = 0;
      let tpPrice = 0;
      let slDistance = 0;
      let tpDistance = 0;
      
      // Dynamic buffer based on spread AND Market Speed
      let bufferOffset = (botState.spreadPoints / 10) * 1.5 || 2.0;
      if (botState.marketSpeed === 'FAST') {
          bufferOffset *= 1.8; // Expand safety buffer in fast market
      }

      const entryPrice = evaluatedSignal === 'BUY' ? currentAsk : currentBid;

      if (evaluatedSignal === 'BUY') {
          slPrice = eaState.m1ObZone.low - bufferOffset;
          slDistance = entryPrice - slPrice;
      } else {
          slPrice = eaState.m1ObZone.high + bufferOffset;
          slDistance = slPrice - entryPrice;
      }
      
      // Dynamic TP based on Market Speed
      // Normal market = target RR 2.4, Fast market = can target RR 3.0
      const targetRR = botState.marketSpeed === 'FAST' ? 3.0 : 2.4;
      tpDistance = slDistance * targetRR;
      
      if (evaluatedSignal === 'BUY') {
          tpPrice = entryPrice + tpDistance;
      } else {
          tpPrice = entryPrice - tpDistance;
      }
      
      // Safety bounds for SL distance
      if (slDistance <= 0.5) {
          console.log(\`[NEW EA SMC] FINAL_DECISION = NO TRADE (SL distance too small: \${slDistance.toFixed(2)})\`);
          resetEASetup('SL_TOO_TIGHT');
          return;
      }
      if (slDistance >= 10.0) { // Max SL distance $10 (100 pips)
          console.log(\`[NEW EA SMC] FINAL_DECISION = NO TRADE (SL distance too large: \${slDistance.toFixed(2)})\`);
          resetEASetup('SL_TOO_WIDE_MARKET_FAST');
          botState.statusMessageKhmer = \`⚠️ [NEW EA SMC] SL ធំពេក (\${slDistance.toFixed(2)}) ទីផ្សារប្រែប្រួលខ្លាំង — រង់ចាំឱកាសក្រោយ\`;
          return;
      }

      const calculatedRR = tpDistance / slDistance;
      if (calculatedRR < 2.0) {
          console.log(\`[NEW EA SMC] FINAL_DECISION = NO TRADE\`);
          console.log(\`[NEW EA SMC] REASON = RR_TOO_LOW (\${calculatedRR.toFixed(2)})\`);
          resetEASetup('RR_TOO_LOW');
          return;
      }

      // Dynamic Lot Calculation based on Risk % + Actual SL Distance
      let dynamicVolume = botState.riskConfig.lotSize;
      const bal = botState.account?.balance || 0;
      const riskPct = botState.riskConfig?.riskPercent || 1;
      
      if (bal > 0) {
          // Standard Gold: $1 move = $100 per lot.
          // SL Risk = Lot * 100 * slDistance
          // Lot = (Balance * Risk%) / (100 * slDistance)
          const riskAmount = bal * (riskPct / 100);
          dynamicVolume = riskAmount / (100 * slDistance);
          
          // Apply bounds
          dynamicVolume = Math.max(0.01, Math.min(dynamicVolume, 5.0)); // arbitrary limits
          // Round to 2 decimals
          dynamicVolume = Number(Math.floor(dynamicVolume * 100) / 100);
      }
      
      // We'll rename volume variable below to use dynamicVolume
`;

// we need to replace from '// --- DYNAMIC SL, TP, & LOT SIZING (SMC STRUCTURE) ---'
// to '      let dynamicVolume = 0.01;\n      const bal = botState.account?.balance || 0;\n      const riskPct = botState.riskConfig?.riskPercent || 1;'

const regex = /\/\/ --- DYNAMIC SL, TP, & LOT SIZING \(SMC STRUCTURE\) ---[\s\S]*?const riskPct = botState\.riskConfig\?\.riskPercent \|\| 1;/m;
content = content.replace(regex, replacement.trim());

// also find 'let volume = ...' and remove it because we use dynamicVolume, or map dynamicVolume to volume
content = content.replace(
    'if (botState.riskConfig?.lotSizeMode === \'risk_percent\' && bal > 0) {\n        // Extremely basic risk% calculation\n        const riskAmount = bal * (riskPct / 100);\n        // Assume 25 pips standard SL, $10 pip value for 1 standard lot. \n        // $250 risk per 1 lot. Volume = riskAmount / 250;\n        let calcVol = riskAmount / 250;\n        calcVol = Math.max(0.01, Math.min(calcVol, 5.0));\n        dynamicVolume = Number(calcVol.toFixed(2));\n      } else {\n        dynamicVolume = botState.riskConfig?.lotSize || 0.01;\n      }\n      \n      let volume = dynamicVolume;',
    'let volume = dynamicVolume;'
);

fs.writeFileSync('server.ts', content);
console.log('patched sl/lot logic');
