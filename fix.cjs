const fs = require('fs');
const file = 'src/MASTER_ICT_EA.ts';
let code = fs.readFileSync(file, 'utf8');

// I need to ensure the closing braces are correct.
code = code.replace("            }\n        }\n            }\n        else {", "            }\n        }\n        else {");
fs.writeFileSync(file, code);
