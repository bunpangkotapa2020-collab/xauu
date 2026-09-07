const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("app.post('/api/bot/action', (req, res) => {", "app.post('/api/bot/action', async (req, res) => {");

fs.writeFileSync('server.ts', code);
