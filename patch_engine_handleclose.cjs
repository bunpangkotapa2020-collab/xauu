const fs = require('fs');
const file = 'src/engines/dara_m1/DaRaM1Engine.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /    const activePos = this\.stateMachine\.getActivePosition\(\);\n    const isAdditional = this\.additionalPosition && String\(this\.additionalPosition\.ticket\) === ticketKey;\n    let targetPos = isAdditional \? this\.additionalPosition : activePos;\n        \n    if \(!targetPos \|\| String\(targetPos\.ticket\) !== ticketKey\) \{/g;

code = code.replace(regex, `    let targetPos = this.stateMachine.getActivePositions().find(p => String(p.ticket) === ticketKey);
        
    if (!targetPos) {`);

fs.writeFileSync(file, code);
