const fs = require('fs');

let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

const oldStr = `  // Build the Entry Status
  let entryStatusStr = '—';
  if (isExecutionBlocked) {
      entryStatusStr = \`🔴 BLOCKED / REJECTED: \${setup?.executionState}\`;
  } else if (isTriggered) {
      entryStatusStr = '🟢 តម្លៃដល់ចំណុចចូល — ENTRY TRIGGERED';
  } else if (fullSetupConfirmed) {
      entryStatusStr = '⏳ កំពុងរង់ចាំតម្លៃចូល';
  }

  return (`;

const newStr = `  return (`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
  console.log('Removed unused string builder');
}
