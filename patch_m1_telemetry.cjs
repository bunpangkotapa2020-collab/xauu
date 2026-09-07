const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const target = "this.addAnalysisLog(`M1 = CONFIRMED / ត្រូវបានបញ្ជាក់ទិសដៅ (${bias})`, 'success');";
const replacement = "this.addAnalysisLog(`M1 = CONFIRMED / ត្រូវបានបញ្ជាក់ទិសដៅ (${bias})`, 'success');\n\t\tthis.telemetry.m1 = {\n\t\t\tdisplacement: 'FOUND',\n\t\t\torderBlock: 'CONFIRMED',\n\t\t\tfvg: 'CONFIRMED',\n\t\t\tretracement: 'CONFIRMED',\n\t\t\tobZone: null,\n\t\t\tfvgZone: null,\n\t\t\tcandleCount: data.m1Candles?.length || 0,\n\t\t\tlastCandleTime: data.m1Candles?.length ? new Date(data.m1Candles[data.m1Candles.length-1].time).toISOString() : undefined\n\t\t};\n";

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
    console.log("Patched M1 telemetry.");
} else {
    console.log("Not found.");
}
