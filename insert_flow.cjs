const fs = require('fs');
let content = fs.readFileSync('src/components/LiveIctEaMonitor.tsx', 'utf8');

const target = `      {/* 3. MULTI-TIMEFRAME ICT PIPELINE CARDS (H4 ➔ M15 ➔ M1) */}`;
const replacement = `      <IctPipelineFlow telemetry={telemetry} state={state} />

      {/* 3. MULTI-TIMEFRAME ICT PIPELINE CARDS (H4 ➔ M15 ➔ M1) */}`;

if (content.includes(target)) {
    fs.writeFileSync('src/components/LiveIctEaMonitor.tsx', content.replace(target, replacement));
    console.log("Replaced");
} else {
    console.log("Target not found");
}
