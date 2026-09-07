const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The original import might have been lost or something. Let's find the first standard import.
const startIndex = code.indexOf('import express from');

// If there's garbage before it, remove it.
if (startIndex !== -1) {
  let cleanCode = code.substring(startIndex);
  const correctTop = `import fs from 'fs';
import path from 'path';

function updateEnvVariable(key: string, value: string) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const regex = new RegExp(\`^\\\\s*\${key}\\\\s*=\\\\s*(.*)$\`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, \`\${key}="\${value}"\`);
  } else {
    envContent += \`\\n\${key}="\${value}"\\n\`;
  }
  fs.writeFileSync(envPath, envContent.trim() + '\\n');
  process.env[key] = value;
}

`;
  fs.writeFileSync('server.ts', correctTop + cleanCode);
  console.log('Fixed top of file');
}
