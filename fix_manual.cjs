const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Line 355 (approx)
code = code.replace(
    /const infoRes = await fetch\(\`\$\{baseUrl\}\/users\/current\/accounts\/\$\{accountId\}\/account-information\`, \{\s*headers: \{ 'auth-token': token \}\s*\}/g,
    "const infoRes = await fetch(`${baseUrl}/users/current/accounts/${accountId}/account-information`, {\n                headers: { 'auth-token': token }\n            });"
);

// We had other fetch calls with `}` instead of `});`
code = code.replace(
    /const res = await fetch\(\`\$\{baseUrl\}\/users\/current\/accounts\/\$\{accountId\}\/symbols\/\$\{sym\}\/current-quote\`, \{\s*headers: \{ 'auth-token': token \}\s*\}\)\.catch/g,
    "const res = await fetch(`${baseUrl}/users/current/accounts/${accountId}/symbols/${sym}/current-quote`, {\n                        headers: { 'auth-token': token }\n                    }).catch"
);

fs.writeFileSync('server.ts', code);
