const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace('isStandalone={isStandalone}\n      />', 'isStandalone={isStandalone}\n      />\n      </ErrorBoundary>');
fs.writeFileSync('src/App.tsx', content);
