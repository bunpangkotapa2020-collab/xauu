const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const importsToInject = `
import { DaRaM1Engine } from './src/engines/dara_m1/DaRaM1Engine.js';
import { DaRaBrokerInterface, DaRaTelegramInterface, DaRaUserSettings } from './src/engines/dara_m1/types.js';
`;

if (!code.includes('import { DaRaM1Engine }')) {
    code = code.replace(
        "import { IctXauusdEA, EAConfig } from './src/MASTER_ICT_EA.js';",
        importsToInject + "\nimport { IctXauusdEA, EAConfig } from './src/MASTER_ICT_EA.js';"
    );
    fs.writeFileSync('server.ts', code);
    console.log('Imports injected');
} else {
    console.log('Already exists');
}
