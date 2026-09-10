const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

// Fix duplicated load
code = code.replace(
  /if \(botState\.riskConfig\.liveTradingEnabled !== undefined\) setLiveTradingEnabled\(Boolean\(botState\.riskConfig\.liveTradingEnabled\)\);\n\s*if \(botState\.riskConfig\.liveTradingEnabled !== undefined\) setLiveTradingEnabled\(Boolean\(botState\.riskConfig\.liveTradingEnabled\)\);/,
  `if (botState.riskConfig.liveTradingEnabled !== undefined) setLiveTradingEnabled(Boolean(botState.riskConfig.liveTradingEnabled));`
);

// Fix handleSave
const handleSaveTarget = `minutesAfterNewsBlock: parsedNewsAfter,
      });`;
const handleSaveReplacement = `minutesAfterNewsBlock: parsedNewsAfter,
        liveTradingEnabled: Boolean(liveTradingEnabled),
      });`;
if (code.includes(handleSaveTarget)) {
    code = code.replace(handleSaveTarget, handleSaveReplacement);
} else {
    console.log("Could not find handleSave target");
}

fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
console.log("Fixed all duplicates and save payload!");
