const fs = require('fs');
const file = 'src/engines/dara_m1/DaRaM1StateMachine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/private activePosition: DaRaPosition \| null = null;\n  private additionalPosition: DaRaPosition \| null = null;/, `private activePositions: DaRaPosition[] = [];`);
code = code.replace(/public getAdditionalPosition\(\): DaRaPosition \| null \{\n    return this\.additionalPosition;\n  \}/, '');
code = code.replace(/public getActivePosition\(\): DaRaPosition \| null \{\n    return this\.activePosition;\n  \}/, `public getActivePositions(): DaRaPosition[] {\n    return this.activePositions;\n  }\n\n  public getActivePosition(): DaRaPosition | null {\n    return this.activePositions.length > 0 ? this.activePositions[0] : null;\n  }`);

fs.writeFileSync(file, code);
