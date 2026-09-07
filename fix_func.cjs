const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// I'll just change the first occurrence to dummy names.
content = content.replace('function resetEASetup', 'function old_resetEASetup');
content = content.replace('var eaState', 'var old_eaState');

fs.writeFileSync('server.ts', content);
