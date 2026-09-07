const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix duplicates
code = code.replace(/import fs from 'fs';\nimport path from 'path';\n/, '');

// Fix async on the control endpoint
code = code.replace("app.post('/api/bot/control', (req, res) => {", "app.post('/api/bot/control', async (req, res) => {");

fs.writeFileSync('server.ts', code);
