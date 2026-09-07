const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// Add trailing stop configs to EAConfig
const configUpdate = `    minSLPoints: number; // Minimum SL distance
    minTPPoints: number; // Minimum TP distance
    minRR: number; // Minimum Risk:Reward Ratio
    
    // Trailing Stop Settings
    trailingStopEnabled: boolean;
    trailingStopActivationPoints: number; // Activation distance (profit) in XAUUSD points
    trailingStopDistancePoints: number; // How far to trail behind current price in XAUUSD points
`;
code = code.replace(/    minSLPoints: number; \/\/ Minimum SL distance\n    minTPPoints: number; \/\/ Minimum TP distance\n    minRR: number; \/\/ Minimum Risk:Reward Ratio/g, configUpdate);

fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
