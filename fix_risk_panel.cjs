const fs = require('fs');
let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

// We need state for SL and TP
if (!code.includes('const [slPips, setSlPips] =')) {
    code = code.replace(/const \[lotSize, setLotSize\] = useState\('0.01'\);/, "const [lotSize, setLotSize] = useState('0.01');\n  const [slPips, setSlPips] = useState('10');\n  const [tpPips, setTpPips] = useState('10');");
    
    // Fix parseFloat
    code = code.replace(/const parsedSlPips = parseFloat\('25'\) \|\| 25;/, "const parsedSlPips = parseFloat(slPips) || 10;");
    code = code.replace(/const parsedTpPips = parseFloat\('35'\) \|\| 35;/, "const parsedTpPips = parseFloat(tpPips) || 10;");
    
    // Add updates
    code = code.replace(/if \(botState\.riskConfig\.lotSize \!\=\= undefined\) setLotSize\(String\(botState\.riskConfig\.lotSize\)\);/, 
    "if (botState.riskConfig.lotSize !== undefined) setLotSize(String(botState.riskConfig.lotSize));\n      if (botState.riskConfig.stopLossPips !== undefined) setSlPips(String(botState.riskConfig.stopLossPips));\n      if (botState.riskConfig.takeProfitPips !== undefined) setTpPips(String(botState.riskConfig.takeProfitPips));");
    
    fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
}
