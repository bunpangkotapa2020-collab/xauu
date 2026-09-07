const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldInterface = code.substring(code.indexOf('interface BotServerState {'), code.indexOf('isAutoSaved?: boolean;\n}') + 'isAutoSaved?: boolean;\n}'.length);

const newInterface = `import { BotState } from './src/types.js';
type BotServerState = BotState;`;

code = code.replace(oldInterface, newInterface);
fs.writeFileSync('server.ts', code);
