const fs = require('fs');
let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

const regex = /\{\/\* SL \(Pips\) \*\/\}[\s\S]*?id="input-tp-pips"[\s\S]*?<\/div>\s*<\/div>/m;
code = code.replace(regex, "");
code = code.replace(/value=\{slPips\}/g, "");
code = code.replace(/value=\{tpPips\}/g, "");
code = code.replace(/setSlPips/g, "(() => {})");
code = code.replace(/setTpPips/g, "(() => {})");
code = code.replace(/slPips/g, "'25'");
code = code.replace(/tpPips/g, "'35'");

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
