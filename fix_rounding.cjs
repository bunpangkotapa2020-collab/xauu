const fs = require('fs');
let content = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

content = content.replace(
  /state\.signalDetails\.entry\.toFixed\(2\)/g,
  'state.signalDetails.entry.toFixed(3)'
);
content = content.replace(
  /state\.signalDetails\.sl\.toFixed\(2\)/g,
  'state.signalDetails.sl.toFixed(3)'
);
content = content.replace(
  /state\.signalDetails\.tp\.toFixed\(2\)/g,
  'state.signalDetails.tp.toFixed(3)'
);

fs.writeFileSync('src/components/MainDashboard.tsx', content);
