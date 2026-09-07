const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(/\{actionResult\.status === 'success'  className="mb-2 text-red-500"\/>\}/g, "");

fs.writeFileSync('src/components/MainDashboard.tsx', code);
