const fs = require('fs');
let code = fs.readFileSync('src/components/DaRaSetupView.tsx', 'utf8');

code = code.replace(/state\.livePrice\?\.goldPrice/g, 'state.goldPrice');
code = code.replace(/state\.livePrice\.goldPrice/g, 'state.goldPrice');
code = code.replace(/state\.livePrice\?\.bidPrice/g, 'state.bidPrice');
code = code.replace(/state\.livePrice\?\.askPrice/g, 'state.askPrice');
code = code.replace(/state\.livePrice\?\.spread/g, 'state.spread');

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log('Fixed live price bindings in DaRaSetupView');
