const fs = require('fs');

const orig = fs.readFileSync('server_original_from_map.ts', 'utf8');
const updateEnvIndex = orig.indexOf('function updateEnvVariable');
const importIndex = orig.indexOf('import express from');

if (updateEnvIndex < importIndex && updateEnvIndex === 0) {
    const topFunc = orig.substring(0, importIndex);
    const rest = orig.substring(importIndex);
    
    // Put imports at top
    let newCode = rest;
    
    // find end of imports (rough approximation)
    const endOfImports = newCode.lastIndexOf("from 'vite';") + "from 'vite';".length;
    // Actually, it has import { BotState } from './src/types.js';
    const importBotStateIndex = newCode.indexOf("import { BotState } from './src/types.js';");
    const insertAfter = importBotStateIndex > -1 ? importBotStateIndex + "import { BotState } from './src/types.js';".length : endOfImports;
    
    newCode = newCode.substring(0, insertAfter) + '\n\n' + topFunc + newCode.substring(insertAfter);
    
    fs.writeFileSync('server.ts', newCode);
    console.log("Restored server.ts");
} else {
    fs.writeFileSync('server.ts', orig);
    console.log("Restored server.ts as is");
}

