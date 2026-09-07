const fs = require('fs');

function fixRiskPanel() {
    let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');
    
    // Add handleSave function
    const handleSave = `
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/bot/update-risk-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify({
          riskConfig: {
            lotSize: parseFloat(lotSize),
            entriesPerSignal: parseInt(entriesPerSignal),
            maxOpenTrades: parseInt(maxOpenTrades),
            stopLossPips: parseInt(slPips),
            takeProfitPips: parseInt(tpPips),
          }
        })
      });
      alert('បានរក្សាទុក (Saved)');
    } catch (e) {
      alert('បញ្ហារក្សាទុក (Error saving)');
    }
  };
`;
    // insert handleSave after useEffect
    code = code.replace(/return \(\s*<div/, handleSave + "\n  return (\n    <div");
    
    code = code.replace(/<button className="flex items-center gap-2 bg-emerald-500\/10/, '<button onClick={handleSave} className="flex items-center gap-2 bg-emerald-500/10');
    
    fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
}

function fixProtectionPanel() {
    let code = fs.readFileSync('src/components/ProtectionSettingsPanel.tsx', 'utf8');
    
    // Add handleSave function
    const handleSave = `
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      // Update protection risk config
      await fetch('/api/bot/update-risk-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify({
          riskConfig: {
            maxConsecutiveLosses: parseInt(maxConsecutiveLosses),
            cooldownMinutes: parseInt(cooldownMinutes),
            maxDailyLossPercent: parseFloat(maxDailyLossPercent),
            maxDailyLossAmount: parseFloat(maxDailyLossAmount),
          }
        })
      });
      
      // Also update trading hours
      await fetch('/api/bot/trading-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify({
          tradingHours: {
            enabled: true,
            startHour,
            stopHour,
          }
        })
      });
      alert('បានរក្សាទុក (Saved)');
    } catch (e) {
      alert('បញ្ហារក្សាទុក (Error saving)');
    }
  };
`;
    code = code.replace(/return \(\s*<div/, handleSave + "\n  return (\n    <div");
    code = code.replace(/<button className="flex items-center gap-2 bg-rose-500\/10/, '<button onClick={handleSave} className="flex items-center gap-2 bg-rose-500/10');
    
    fs.writeFileSync('src/components/ProtectionSettingsPanel.tsx', code);
}

fixRiskPanel();
fixProtectionPanel();
