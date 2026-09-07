const fs = require('fs');

let panel = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

// 1. Remove the previously incorrectly injected vars
panel = panel.replace(/  const activeTrade = botState\?.openTrades\?\.\[0\];\n  const activeSide = activeTrade\?.side \|\| botState\?.signalDetails\?.side \|\| '';\n  const activeEntry = activeTrade\?.entryPrice \|\| botState\?.signalDetails\?.entry \|\| 0;\n  const activeSL = activeTrade\?.sl \|\| botState\?.signalDetails\?.sl \|\| 0;\n  const activeTP = activeTrade\?.tp \|\| botState\?.signalDetails\?.tp \|\| 0;\n  const activeRR = \(activeEntry && activeSL && activeTP\) \n    \? \(Math.abs\(activeTP - activeEntry\) \/ Math.abs\(activeEntry - activeSL\)\)\n    : 0;\n\n  return \(\(\) => window.removeEventListener\('open_settings', handleOpen\)\);\n/g, "  return () => window.removeEventListener('open_settings', handleOpen);");

const hookDefs = `
  const activeTrade = botState?.openTrades?.[0];
  const activeSide = activeTrade?.side || botState?.signalDetails?.side || '';
  const activeEntry = activeTrade?.entryPrice || botState?.signalDetails?.entry || 0;
  const activeSL = activeTrade?.sl || botState?.signalDetails?.sl || 0;
  const activeTP = activeTrade?.tp || botState?.signalDetails?.tp || 0;
  const activeRR = (activeEntry && activeSL && activeTP) 
    ? (Math.abs(activeTP - activeEntry) / Math.abs(activeEntry - activeSL))
    : 0;

  return (
    <div className="text-white relative font-sans p-2">`;

panel = panel.replace(/  return \(\n    <div className="text-white relative font-sans p-2">/g, hookDefs);

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', panel);
