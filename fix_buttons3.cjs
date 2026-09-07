const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(/\? 'SUCCESS' : 'FAILED'/g, "? '🟢 SUCCESS' : '🔴 FAILED'");
code = code.replace(/\? <CheckCircle2.*?: <XOctagon.*?\}/g, ""); // Remove the duplicate CheckCircle / XOctagon icons if we are using Emojis

fs.writeFileSync('src/components/MainDashboard.tsx', code);
