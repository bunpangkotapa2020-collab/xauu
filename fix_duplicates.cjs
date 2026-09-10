const fs = require('fs');
let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

// The lines were duplicated:
const target = `const [newsMinsAfter, setNewsMinsAfter] = useState('30');
  const [liveTradingEnabled, setLiveTradingEnabled] = useState(false);
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);
  const [liveTradingEnabled, setLiveTradingEnabled] = useState(false);
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);`;

const replacement = `const [newsMinsAfter, setNewsMinsAfter] = useState('30');
  const [liveTradingEnabled, setLiveTradingEnabled] = useState(false);
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
console.log("Fixed duplicates!");
