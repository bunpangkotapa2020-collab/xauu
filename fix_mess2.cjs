const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /body: JSON\.stringify\(\{\s*actionType: 'POSITION_MODIFY',[\s\S]*?\}\)\s*\}/,
    "body: JSON.stringify({\n                    actionType: 'POSITION_MODIFY',\n                })\n            });"
);

fs.writeFileSync('server.ts', code);
