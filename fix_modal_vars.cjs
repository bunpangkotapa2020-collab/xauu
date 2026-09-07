const fs = require('fs');

let panel = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

const hookDefs = `
  const calculatedLotValue = parseFloat(lotSize) || 0.01;
  
  const activeTrade = botState?.openTrades?.[0];
  const activeSide = activeTrade?.side || botState?.signalDetails?.side || '';
  const activeEntry = activeTrade?.entryPrice || botState?.signalDetails?.entry || 0;
  const activeSL = activeTrade?.sl || botState?.signalDetails?.sl || 0;
  const activeTP = activeTrade?.tp || botState?.signalDetails?.tp || 0;
  const activeRR = (activeEntry && activeSL && activeTP) 
    ? (Math.abs(activeTP - activeEntry) / Math.abs(activeEntry - activeSL))
    : 0;
`;

panel = panel.replace(/  const calculatedLotValue = parseFloat\(lotSize\) \|\| 0\.01;/, hookDefs);

fs.writeFileSync('src/components/BotSettingsModal.tsx', panel);
