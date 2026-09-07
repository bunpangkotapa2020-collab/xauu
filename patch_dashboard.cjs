const fs = require('fs');

let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf-8');

// Replace import
code = code.replace("import { LiveIctEaMonitor } from './LiveIctEaMonitor';", "import { DaRaSetupView } from './DaRaSetupView';");

// Replace component
code = code.replace("<LiveIctEaMonitor state={state} />", "<DaRaSetupView state={state} />");

fs.writeFileSync('src/components/MainDashboard.tsx', code);
console.log('MainDashboard patched');
