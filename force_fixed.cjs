const fs = require('fs');

let panel = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

// Ensure lotSizeMode is set to 'fixed' in updatedRiskConfig
panel = panel.replace(/lotSizeMode,\n        lotSize:/, "lotSizeMode: 'fixed',\n        lotSize:");

fs.writeFileSync('src/components/BotSettingsModal.tsx', panel);
