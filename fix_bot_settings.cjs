const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

// Ensure useRef is imported
if (!code.includes('useRef')) {
  code = code.replace(/import React, { useState, useEffect } from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
}

// Replace the useEffect block
const oldEffect = `  // Load initial from botState
  useEffect(() => {
    if (isOpen && botState?.riskConfig) {
      if (botState.riskConfig.lotSize !== undefined) setLotSize(String(botState.riskConfig.lotSize));
      if (botState.riskConfig.stopLossPips !== undefined) setSlDist(String(botState.riskConfig.stopLossPips));
      if (botState.riskConfig.takeProfitPips !== undefined) setTpDist(String(botState.riskConfig.takeProfitPips));
      if (botState.riskConfig.maxDailyLossAmount !== undefined) setDailyLoss(String(botState.riskConfig.maxDailyLossAmount));
      if (botState.riskConfig.maxOpenTrades !== undefined) setMaxTrades(String(botState.riskConfig.maxOpenTrades));
      if (botState.riskConfig.maxConsecutiveLosses !== undefined) setMaxConsSL(String(botState.riskConfig.maxConsecutiveLosses));
      if (botState.riskConfig.cooldownMinutes !== undefined) setCooldown(String(botState.riskConfig.cooldownMinutes));
      setSuccessMsg(false);
      setErrorMsg('');
    }
  }, [isOpen, botState]);`;

const newEffect = `  const hasInitialized = useRef(false);

  // Load initial from botState
  useEffect(() => {
    if (isOpen) {
      if (botState?.riskConfig && !hasInitialized.current) {
        if (botState.riskConfig.lotSize !== undefined) setLotSize(String(botState.riskConfig.lotSize));
        if (botState.riskConfig.stopLossPips !== undefined) setSlDist(String(botState.riskConfig.stopLossPips));
        if (botState.riskConfig.takeProfitPips !== undefined) setTpDist(String(botState.riskConfig.takeProfitPips));
        if (botState.riskConfig.maxDailyLossAmount !== undefined) setDailyLoss(String(botState.riskConfig.maxDailyLossAmount));
        if (botState.riskConfig.maxOpenTrades !== undefined) setMaxTrades(String(botState.riskConfig.maxOpenTrades));
        if (botState.riskConfig.maxConsecutiveLosses !== undefined) setMaxConsSL(String(botState.riskConfig.maxConsecutiveLosses));
        if (botState.riskConfig.cooldownMinutes !== undefined) setCooldown(String(botState.riskConfig.cooldownMinutes));
        setSuccessMsg(false);
        setErrorMsg('');
        hasInitialized.current = true;
      }
    } else {
      hasInitialized.current = false;
    }
  }, [isOpen, botState]);`;

code = code.replace(oldEffect, newEffect);

fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
console.log('Fixed BotSettingsModal.tsx');
