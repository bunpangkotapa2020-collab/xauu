const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

if (!code.includes("import { ProtectionSettingsPanel }")) {
    code = code.replace(
        "import { RiskSettingsPanel } from './RiskSettingsPanel';",
        "import { RiskSettingsPanel } from './RiskSettingsPanel';\nimport { ProtectionSettingsPanel } from './ProtectionSettingsPanel';"
    );
}

if (!code.includes("<ProtectionSettingsPanel botState={state} />")) {
    code = code.replace(
        "<RiskSettingsPanel botState={state} />",
        "<RiskSettingsPanel botState={state} />\n        <ProtectionSettingsPanel botState={state} />"
    );
}

fs.writeFileSync('src/components/MainDashboard.tsx', code);
