const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = "const accountsRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.ai/users/current/accounts', {";
const replacement1 = "const accountsRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {";

if (code.includes(target1)) {
    code = code.replace(target1, replacement1);
    fs.writeFileSync('server.ts', code);
    console.log('Fixed MetaApi Provisioning URL in verify route');
} else {
    console.log('Target not found in verify route');
}
