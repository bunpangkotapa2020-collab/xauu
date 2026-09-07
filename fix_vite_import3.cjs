const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/import \{ createServer as createViteServer \}[\s]*function updateEnvVariable/g, "import { createServer as createViteServer } from 'vite';\n\nfunction updateEnvVariable");

fs.writeFileSync('server.ts', code);
