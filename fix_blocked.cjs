const fs = require('fs');

let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

const oldBlocked = `  const isExecutionBlocked = actualExecutionState && actualExecutionState.includes('REJECTED');`;
const newBlocked = `  const isExecutionBlocked = actualExecutionState && (actualExecutionState.includes('REJECTED') || actualExecutionState.includes('BLOCKED'));`;

content = content.replace(oldBlocked, newBlocked);
fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
