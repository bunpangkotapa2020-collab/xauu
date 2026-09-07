const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /\/symbols\/\$\{sym\}\/current-quote\`/g,
    "/symbols/${sym}/current-price`"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed current-price endpoint');
