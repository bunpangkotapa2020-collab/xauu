const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Remove the Telegram block from its current location
const startTag = "// ============================================\n// TELEGRAM NOTIFICATION LAYER (READ-ONLY)\n// ============================================";
const endTag = "// ============================================\n";

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag, startIndex + startTag.length);

if (startIndex !== -1 && endIndex !== -1) {
    const telegramBlock = code.substring(startIndex, endIndex + endTag.length);
    code = code.replace(telegramBlock, '');
    
    // Remove export
    const fixedBlock = telegramBlock.replace('export async function sendTelegramAlert', 'async function sendTelegramAlert');
    
    // Inject right after the imports
    const importVite = "import { createServer as createViteServer } from 'vite';";
    code = code.replace(importVite, importVite + "\n\n" + fixedBlock);
    
    fs.writeFileSync('server.ts', code);
    console.log("Fixed!");
} else {
    console.log("Could not find block");
}
