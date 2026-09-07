const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/\\n\s*\/\/\ Consecutive/g, '\n                // Consecutive');
// Fix eaState
content = content.replace(/let eaState =/g, 'var eaState =');

fs.writeFileSync('server.ts', content);
