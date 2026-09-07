const fs = require('fs');
let code = fs.readFileSync('src/components/LiveIctEaMonitor.tsx', 'utf8');

const target = `    if (raw.includes('CISD CONFIRMED') && (raw.includes('DISPLACEMENT') || raw.includes('OB'))) {
      return '⏳ បាន CISD ហើយ — តម្លៃប៉ះ LOCKED ENTRY';
    }`;

const replacement = `    if (raw.includes('WAITING FOR M1 CONFIRMATION')) {
      return '⏳ កំពុងរង់ចាំ M1 បញ្ជាក់ទិសដៅ (WAITING FOR M1 CONFIRMATION)';
    }`;

code = code.replace(target, replacement);

const target2 = `    if (raw.includes('OB/FVG FOUND') || raw.includes('WAITING FOR RETRACEMENT') || raw.includes('RETRACEMENT')) {
      return raw.startsWith('⏳ SETUP VALID') ? raw : \`🟢 EA កំពុងធ្វើការ | ⏳ Setup ត្រូវបានរកឃើញ | ⏳ កំពុងរង់ចាំ Retracement | 🔄 Analysis កំពុងបន្ត (\${raw})\`;
    }`;

const replacement2 = `    if (raw.includes('WAITING FOR ENTRY')) {
      return '⏳ FULL SETUP READY — រង់ចាំតម្លៃមកប៉ះ Locked Entry (WAITING FOR ENTRY TOUCH)';
    }`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/LiveIctEaMonitor.tsx', code);
console.log("Patched wait messages.");
