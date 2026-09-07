const fs = require('fs');
const path = './src/components/MainDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Also update the condition on the START button in MainDashboard
content = content.replace(
  /if \(!botState.account\?.isConnected \|\| !botState.account\?.isRealAccount \|\| botState.account\?.serverConnected === false\) {/g,
  `if (!botState.account?.isConnected || !botState.account?.isRealAccount || botState.account?.serverConnected === false || !botState.account?.tradingPermission) {`
);

fs.writeFileSync(path, content, 'utf8');
