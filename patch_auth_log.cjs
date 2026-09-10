const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(
  "return res.status(401).json({ valid: false, error: 'Session អស់សុពលភាព' });",
  "console.error('401 Unauthorized triggered! Auth Header:', req.headers.authorization, 'Payload:', (req as any).user);\n      return res.status(401).json({ valid: false, error: 'Session អស់សុពលភាព' });"
);
fs.writeFileSync('server.ts', code);
