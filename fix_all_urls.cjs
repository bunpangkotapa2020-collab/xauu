const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/https:\/\/mt-provisioning-api-v1\.agiliumtrade\.ai\/users\/current\/accounts/g, 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts');

fs.writeFileSync('server.ts', code);
console.log('Fixed all MetaAPI URLs in server.ts');
