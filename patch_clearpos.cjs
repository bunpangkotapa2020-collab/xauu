const fs = require('fs');
const file = 'src/engines/dara_m1/DaRaM1StateMachine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/    \/\/ If all positions are closed, go to TRADE_CLOSED\n    if \\(this\.activePositions\.length === 0 && this\.currentState === 'TRADE_ACTIVE'\\) \\{\n      this\.onPositionClosed\\(\\);\n    \\}/, '');

fs.writeFileSync(file, code);
