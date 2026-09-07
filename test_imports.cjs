const fs = require('fs');
let code = fs.readFileSync('server_original_from_map.ts', 'utf8');
const importStart = code.indexOf("import express from 'express';");
const dotenvIndex = code.indexOf("dotenv.config();");
const importsStr = code.substring(importStart, dotenvIndex);
console.log("importsStr ends with:", JSON.stringify(importsStr.substring(importsStr.length - 20)));
