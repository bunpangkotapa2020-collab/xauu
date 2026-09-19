const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

// Update express server to force download for .tar.gz files
const downloadMiddleware = `
  // Force download for tar.gz files
  app.get('*.tar.gz', (req, res, next) => {
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('Content-Type', 'application/gzip');
    next();
  });
`;

if (!serverCode.includes('Content-Disposition')) {
  serverCode = serverCode.replace('// API routes FIRST', downloadMiddleware + '\n  // API routes FIRST');
  fs.writeFileSync('server.ts', serverCode);
  console.log('Fixed server.ts');
} else {
  console.log('Already fixed');
}
