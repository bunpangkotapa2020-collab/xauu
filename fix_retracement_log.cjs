const fs = require('fs');
let code = fs.readFileSync('src/components/LiveIctEaMonitor.tsx', 'utf8');

const target = `    if (raw.includes('RETRACEMENT CONFIRMED') || raw.includes('READY TO EXECUTE')) {
      return '🟢 បានទាញថយក្រោយពេញលេញ — ត្រៀមបើក Trade (READY TO EXECUTE)';
    }`;
const rep = `    if (raw.includes('READY TO EXECUTE')) {
      return '🟢 ត្រៀមបើក Trade (READY TO EXECUTE)';
    }`;

code = code.replace(target, rep);

const target2 = `    if (raw.includes('OB/FVG FOUND') || raw.includes('WAITING FOR RETRACEMENT') || raw.includes('RETRACEMENT')) {
      return raw.startsWith('⏳ SETUP VALID') ? raw : \`🟢 EA កំពុងធ្វើការ | ⏳ Setup ត្រូវបានរកឃើញ | ⏳ កំពុងរង់ចាំ Retracement | 🔄 Analysis កំពុងបន្ត (\${raw})\`;
    }`;
const rep2 = `    if (raw.includes('OB/FVG FOUND')) {
      return raw.startsWith('⏳ SETUP VALID') ? raw : \`🟢 EA កំពុងធ្វើការ | ⏳ Setup ត្រូវបានរកឃើញ | 🔄 Analysis កំពុងបន្ត (\${raw})\`;
    }`;

code = code.replace(target2, rep2);

fs.writeFileSync('src/components/LiveIctEaMonitor.tsx', code);
console.log("Updated waiting reasons to remove RETRACEMENT.");
