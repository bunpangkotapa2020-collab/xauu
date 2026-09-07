const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

code = code.replace(
    "{botState?.account?.currency || 'USC' === 'USC' &&",
    "{(botState?.account?.currency || 'USC') === 'USC' &&"
);

fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
