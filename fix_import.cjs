const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

if (!code.includes("import { RiskSettingsPanel }")) {
    code = code.replace(
        "import { botApi } from '../services/api';",
        "import { botApi } from '../services/api';\nimport { RiskSettingsPanel } from './RiskSettingsPanel';"
    );
}

if (!code.includes("<RiskSettingsPanel botState={state} />")) {
    code = code.replace(
        "      </main>",
        "        <RiskSettingsPanel botState={state} />\n      </main>"
    );
}

fs.writeFileSync('src/components/MainDashboard.tsx', code);
