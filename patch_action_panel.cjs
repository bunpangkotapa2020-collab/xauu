const fs = require('fs');
let code = fs.readFileSync('src/components/ActionControlsPanel.tsx', 'utf-8');

code = code.replace(/\(NEW ICT EA ACTIVE & SCANNING M1\)/g, "(DaRa M1 EA ACTIVE & SCANNING M1)");
code = code.replace(/\(START NEW ICT EA & CONTINUOUS M1 ANALYSIS\)/g, "(START DaRa M1 EA & CONTINUOUS M1 ANALYSIS)");
code = code.replace(/ចាប់ផ្តើមដំណើរការ NEW ICT EA ពេញលេញ វិភាគ H4 ➔ M15 ➔ M1 ជាបន្តបន្ទាប់ និងអនុញ្ញាតឱ្យបើក Real Trade ពេល Valid ICT Setup ពេញលេញ 100%/g, "ចាប់ផ្តើមដំណើរការ DaRa M1 EA ពេញលេញ ស្វែងរក Liquidity Sweep លើ M1 និងអនុញ្ញាតឱ្យបើក Real Trade ពេលមាន Setup ពេញលេញ");

fs.writeFileSync('src/components/ActionControlsPanel.tsx', code);
console.log('ActionControlsPanel patched');
