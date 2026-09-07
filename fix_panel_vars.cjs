const fs = require('fs');

let panel = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

// Remove trailingStopActivationPoints from useEffect array
panel = panel.replace(/botState\?\.riskConfig\?\.trailingStopActivationPoints, botState\?\.riskConfig\?\.trailingStopDistancePoints/g, "");

// Inject the variables right before the return statement.
// We can find `return (` and replace it.
const hookDefs = `
  const activeTrade = botState?.openTrades?.[0];
  const activeSide = activeTrade?.side || botState?.signalDetails?.side || '';
  const activeEntry = activeTrade?.entryPrice || botState?.signalDetails?.entry || 0;
  const activeSL = activeTrade?.sl || botState?.signalDetails?.sl || 0;
  const activeTP = activeTrade?.tp || botState?.signalDetails?.tp || 0;
  const activeRR = (activeEntry && activeSL && activeTP) 
    ? (Math.abs(activeTP - activeEntry) / Math.abs(activeEntry - activeSL))
    : 0;

  return (`;

panel = panel.replace(/return \(/, hookDefs);

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', panel);
