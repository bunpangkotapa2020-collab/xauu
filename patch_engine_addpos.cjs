const fs = require('fs');
const file = 'src/engines/dara_m1/DaRaM1Engine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/  private additionalPosition: DaRaPosition \| null = null;\n/g, '');
code = code.replace(/    this\.additionalPosition = null;\n/g, '');
code = code.replace(/  public getAdditionalPosition\(\): DaRaPosition \| null \{\n    return this\.additionalPosition;\n  \}\n/g, '');
code = code.replace(/    this\.additionalPosition = this\.stateMachine\.getAdditionalPosition\(\);\n/g, '');
code = code.replace(/    const isAdditional = this\.additionalPosition && String\(this\.additionalPosition\.ticket\) === ticketKey;\n    let targetPos = isAdditional \? this\.additionalPosition : activePos;\n    if \(!targetPos\) targetPos = position;/g, '    let targetPos = position;');

fs.writeFileSync(file, code);
