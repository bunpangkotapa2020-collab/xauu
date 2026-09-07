const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = "if (!quoteRes.ok && quoteRes.status !== 429) console.log(`[QUOTE ERROR] ${quoteRes.status} ${quoteRes.statusText} URL: ${workingBaseUrl}/users/current/accounts/${accountId}/symbols/${primarySymbol}/current-price`); else if (quoteRes.status === 429) console.log(`[QUOTE ERROR] 429 Too Many Requests (Rate Limited). Retrying next cycle...`);";
const replacement = "if (!quoteRes.ok && quoteRes.status !== 429) console.log(`[QUOTE ERROR] ${quoteRes.status} ${quoteRes.statusText} URL: ${workingBaseUrl}/users/current/accounts/${accountId}/symbols/${primarySymbol}/current-price`);";

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Patched QUOTE ERROR log (silenced 429).");
} else {
    console.log("Target not found.");
}
