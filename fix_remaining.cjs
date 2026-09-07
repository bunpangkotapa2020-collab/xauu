const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /signal: AbortSignal\.timeout\(6000\)\s*\}/g,
    "signal: AbortSignal.timeout(6000)\n                });"
);

code = code.replace(
    /headers: \{ 'auth-token': apiKey\.trim\(\) \}\s*\}/g,
    "headers: { 'auth-token': apiKey.trim() }\n           });"
);

code = code.replace(
    /headers: \{ 'auth-token': cleanApiKey \}\s*\}/g,
    "headers: { 'auth-token': cleanApiKey }\n            });"
);

code = code.replace(
    /headers: \{ 'auth-token': token \}\s*\}/g,
    "headers: { 'auth-token': token }\n            });"
);

code = code.replace(
    /headers: \{ 'auth-token': token, 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{\s*actionType: 'POSITION_MODIFY',\s*\}\)\s*\}/g,
    "headers: { 'auth-token': token, 'Content-Type': 'application/json' },\n                body: JSON.stringify({\n                    actionType: 'POSITION_MODIFY',\n                })\n            });"
);

fs.writeFileSync('server.ts', code);
