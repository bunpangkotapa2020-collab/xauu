const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = "export function updateEnvVariabletype BotServerState = BotState;";
if (code.includes(target)) {
    const replacement = `export function updateEnvVariable(key: string, value: string) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  const regex = new RegExp(\`^\${key}=.*\`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, \`\${key}=\${value}\`);
  } else {
    envContent += \`\\n\${key}=\${value}\`;
  }
  fs.writeFileSync(envPath, envContent.trim() + '\\n');
  process.env[key] = value;
}

type BotServerState = BotState;`;
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Fixed!");
}
