const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// I'll just change the first occurrence of old_resetEASetup to old_resetEASetup_v1
content = content.replace('function old_resetEASetup', 'function old_resetEASetup_v1');

fs.writeFileSync('server.ts', content);
