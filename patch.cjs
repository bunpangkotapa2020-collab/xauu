const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/if \(signature !== expectedSignature\) return null;/g, "if (signature !== expectedSignature) { console.error('Signature mismatch'); return null; }");
code = code.replace(/if \(Date.now\(\) > payload.exp\) return null;/g, "if (Date.now() > payload.exp) { console.error('Token expired'); return null; }");
fs.writeFileSync('server.ts', code);
