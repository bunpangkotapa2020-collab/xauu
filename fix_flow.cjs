const fs = require('fs');
let code = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

const target = `  const m1Confirmed = telemetry.m1?.displacement === 'FOUND' || fullSetupReady; // Using displacement field as general confirmation
  const fullSetupReady = setup !== null && setup !== undefined;`;

const replacement = `  const fullSetupReady = setup !== null && setup !== undefined;
  const m1Confirmed = telemetry.m1?.displacement === 'FOUND' || fullSetupReady; // Using displacement field as general confirmation`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/IctPipelineFlow.tsx', code);
    console.log("Fixed TDZ for fullSetupReady");
} else {
    console.log("Target not found");
}
