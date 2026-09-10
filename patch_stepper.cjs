const fs = require('fs');
let code = fs.readFileSync('src/components/DaRaSetupView.tsx', 'utf-8');

// Fix the isTrailed logic and currentStep calculation
const oldLogic = `  } else if (activeTrade) {
    const isTrailed = setup && activeTrade.sl && (activeTrade.side === 'BUY' ? activeTrade.sl > setup.virtualSLPrice : activeTrade.sl < setup.virtualSLPrice);
    currentStep = isTrailed || daraState === 'TRAILING' ? 10 : 9;`;

const newLogic = `  } else if (activeTrade) {
    const isTrailed = setup && activeTrade.sl && setup.sharedSL && (activeTrade.side === 'BUY' ? activeTrade.sl > setup.sharedSL : activeTrade.sl < setup.sharedSL);
    currentStep = isTrailed || daraState === 'TRAILING' ? 10 : 9;`;

code = code.replace(oldLogic, newLogic);

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log("Patched DaRaSetupView.tsx");
