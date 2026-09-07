const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const start = code.indexOf('interface BotServerState {');
const end = code.indexOf('isAutoSaved?: boolean;\n}', start) + 'isAutoSaved?: boolean;\n}'.length;

if (start > -1 && end > -1) {
    code = code.substring(0, start) + code.substring(end);
    fs.writeFileSync('server.ts', code);
    console.log("Removed old interface!");
}
