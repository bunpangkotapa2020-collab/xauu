const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /botState\.signalDetails = \{\s+side: daraSetup\.direction,[\s\S]*?obLow: daraSetup\.sweepLevel\s+\};/g;

const newDetails = `
           botState.signalDetails = {
               side: daraSetup.direction,
               entry: daraSetup.lockedEntryPrice,
               actualEntry: daraSetup.lockedEntryPrice,
               sl: daraSetup.virtualSLPrice,
               tp: daraSetup.virtualTPPrice,
               stage: daraState,
               executionState: daraState,
               ticket: daraSetup.status === 'EXECUTED' ? 'Yes' : undefined,
               obHigh: daraSetup.mssLevel,
               obLow: daraSetup.sweepLevel,
               // DaRa Specific properties
               daraState: daraState,
               daraSetup: daraSetup
           };
`;

code = code.replace(regex, newDetails.trim());

fs.writeFileSync('server.ts', code);
console.log('Done');
