const fs = require('fs');
let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

// Replace all \${ with ${
content = content.replace(/\\\$\{/g, '${');

fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
