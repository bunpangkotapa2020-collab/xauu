const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace BotServerState interface
const oldInterfaceStart = code.indexOf('interface BotServerState {');
const oldInterfaceEnd = code.indexOf('isAutoSaved?: boolean;', oldInterfaceStart);
if (oldInterfaceStart > -1 && oldInterfaceEnd > -1) {
    code = code.substring(0, oldInterfaceStart) + 'import { BotState } from "./src/types";\ntype BotServerState = BotState;\n/* ' + code.substring(oldInterfaceStart, oldInterfaceEnd + 'isAutoSaved?: boolean;\n}'.length) + ' */\n' + code.substring(oldInterfaceEnd + 'isAutoSaved?: boolean;\n}'.length);
    fs.writeFileSync('server.ts', code);
}
