const fs = require('fs');
let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

// Insert slPips and tpPips state
if (!code.includes('const [slPips, setSlPips] = useState<string>')) {
    code = code.replace(/const \[lotSize, setLotSize\] = useState<string>\([\s\S]*?\);/, (match) => {
        return match + "\n  const [slPips, setSlPips] = useState<string>(String(botState?.riskConfig?.stopLossPips || 10));\n  const [tpPips, setTpPips] = useState<string>(String(botState?.riskConfig?.takeProfitPips || 10));";
    });
}

// Add the setSlPips missing from reset to initial botState
if (!code.includes('setSlPips(String(botState.riskConfig.stopLossPips))')) {
    code = code.replace(/if \(botState\.riskConfig\.lotSize \!\=\= undefined\) \{\n\s*setLotSize\(String\(botState\.riskConfig\.lotSize\)\);\n\s*\}/, (match) => {
        return match + "\n      if (botState.riskConfig.stopLossPips !== undefined) {\n        setSlPips(String(botState.riskConfig.stopLossPips));\n      }\n      if (botState.riskConfig.takeProfitPips !== undefined) {\n        setTpPips(String(botState.riskConfig.takeProfitPips));\n      }";
    });
}

// There was an issue around line 121: 
// if (botState.riskConfig.lotSize !== undefined) setLotSize(String(botState.riskConfig.lotSize));
// Let's replace the missing functions exactly
code = code.replace(/if \(botState\.riskConfig\.lotSize \!\=\= undefined\) setLotSize\(String\(botState\.riskConfig\.lotSize\)\);\n\s*if \(botState\.riskConfig\.stopLossPips \!\=\= undefined\) setSlPips\(String\(botState\.riskConfig\.stopLossPips\)\);\n\s*if \(botState\.riskConfig\.takeProfitPips \!\=\= undefined\) setTpPips\(String\(botState\.riskConfig\.takeProfitPips\)\);/, (match) => {
    return "      if (botState.riskConfig.lotSize !== undefined) setLotSize(String(botState.riskConfig.lotSize));\n      if (botState.riskConfig.stopLossPips !== undefined) setSlPips(String(botState.riskConfig.stopLossPips));\n      if (botState.riskConfig.takeProfitPips !== undefined) setTpPips(String(botState.riskConfig.takeProfitPips));";
});

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
