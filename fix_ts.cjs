const fs = require('fs');
let panel = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

panel = panel.replace(/botState\?\.riskConfig\?\.lotSizeMode: 'fixed',/g, "botState?.riskConfig?.lotSizeMode,");

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', panel);
