const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `const RECOVERY_LOG_PATH = path.join(DATA_DIR, 'recovery_logs.json');`;
const replacement = `const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const RECOVERY_LOG_PATH = path.join(DATA_DIR, 'recovery_logs.json');`;

code = code.replace(targetStr, replacement);

const redundantDataDir = `const DATA_DIR = path.join(process.cwd(), 'data');`;
const redundantMkdir = `if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}`;

// Need to remove the redundant one below
code = code.replace(`const DATA_DIR = path.join(process.cwd(), 'data');\nconst AUTH_FILE_PATH`, `const AUTH_FILE_PATH`);
code = code.replace(`if (!fs.existsSync(DATA_DIR)) {\n  fs.mkdirSync(DATA_DIR, { recursive: true });\n}`, ``);

fs.writeFileSync('server.ts', code);
