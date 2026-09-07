const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldLogic = `        if (daraSetup) {
           botState.signals = { gold: daraSetup.direction };
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
        } else {
           botState.signals = { gold: 'WAIT' };
           botState.signalDetails = undefined;
        }`;

const newLogic = `        botState.signals = { gold: daraSetup ? daraSetup.direction : 'WAIT' };
        botState.signalDetails = {
           side: daraSetup ? daraSetup.direction : undefined,
           entry: daraSetup ? daraSetup.lockedEntryPrice : undefined,
           actualEntry: daraSetup ? daraSetup.lockedEntryPrice : undefined,
           sl: daraSetup ? daraSetup.virtualSLPrice : undefined,
           tp: daraSetup ? daraSetup.virtualTPPrice : undefined,
           stage: daraState,
           executionState: daraState,
           ticket: (daraSetup && daraSetup.status === 'EXECUTED') ? 'Yes' : undefined,
           obHigh: daraSetup ? daraSetup.mssLevel : undefined,
           obLow: daraSetup ? daraSetup.sweepLevel : undefined,
           // DaRa Specific properties
           daraState: daraState,
           daraSetup: daraSetup
        };`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('server.ts', code);
console.log('patched server.ts');
