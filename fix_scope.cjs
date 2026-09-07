const fs = require('fs');

let panel = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

// Remove from useEffect
panel = panel.replace(/  const activeTrade = botState\?.openTrades\?\.\[0\];\n  const activeSide = activeTrade\?.side \|\| botState\?.signalDetails\?.side \|\| '';\n  const activeEntry = activeTrade\?.entryPrice \|\| botState\?.signalDetails\?.entry \|\| 0;\n  const activeSL = activeTrade\?.sl \|\| botState\?.signalDetails\?.sl \|\| 0;\n  const activeTP = activeTrade\?.tp \|\| botState\?.signalDetails\?.tp \|\| 0;\n  const activeRR = \(activeEntry && activeSL && activeTP\) \n    \? \(Math.abs\(activeTP - activeEntry\) \/ Math.abs\(activeEntry - activeSL\)\)\n    : 0;\n\n  return \(\n    <div className="text-white relative font-sans p-2">/g, "  return () => window.removeEventListener('open_settings', handleOpen);\n    <div className=\"text-white relative font-sans p-2\">"); // Wait, I messed up the replacement string previously?
// Ah! In my previous script, I replaced:
// return (\n    <div className="text-white relative font-sans p-2">
// with hookDefs + return (\n    <div className="text-white relative font-sans p-2">

// Let's just read and manually fix the structure cleanly.
