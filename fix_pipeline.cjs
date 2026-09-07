const fs = require('fs');
let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

const oldLogic = `  const fullSetupConfirmed = h4Confirmed && m15Confirmed && m1Confirmed;`;
const newLogic = `  const fullSetupConfirmed = !!setup || (h4Confirmed && m15Confirmed && m1Confirmed);`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
