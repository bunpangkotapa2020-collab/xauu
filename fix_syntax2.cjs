const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Undo the global replace of `            }` -> `            });`
code = code.replace(/            \}\);/g, '            }');

fs.writeFileSync('server.ts', code);
