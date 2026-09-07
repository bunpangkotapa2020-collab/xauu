const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/export function updateEnvVariable\s*type BotServerState = BotState;/, `export function updateEnvVariable(key: string, value: string) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  const regex = new RegExp(\`^\\\${key}=.*\`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, \`\\\${key}=\\\${value}\`);
  } else {
    envContent += \`\\n\\\${key}=\\\${value}\`;
  }
  fs.writeFileSync(envPath, envContent.trim() + '\\n');
  process.env[key] = value;
}

type BotServerState = BotState;`);

fs.writeFileSync('server.ts', code);
