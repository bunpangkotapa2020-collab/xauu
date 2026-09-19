const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

const downloadCode = `
    app.get('/dara_m1_ea_FINAL_TRAILING_V1.4.tar.gz', (req, res) => {
      const filePath = path.join(process.cwd(), 'public', 'dara_m1_ea_FINAL_TRAILING_V1.4.tar.gz');
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', 'attachment; filename="dara_m1_ea_FINAL_TRAILING_V1.4.tar.gz"');
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        res.status(404).send('V1.4 package not found');
      }
    });
`;

if (!serverCode.includes('dara_m1_ea_FINAL_TRAILING_V1.4.tar.gz')) {
  // Add to both dev and prod branches
  serverCode = serverCode.replace("app.use(vite.middlewares);", downloadCode + "\n    app.use(vite.middlewares);");
  serverCode = serverCode.replace("app.get('*', (req, res) => {", downloadCode + "\n    app.get('*', (req, res) => {");
  fs.writeFileSync('server.ts', serverCode);
  console.log('Fixed server.ts');
} else {
  console.log('Already fixed');
}
