const fs = require('fs');
let code = fs.readFileSync('server_original_from_map.ts', 'utf8');
const importStart = code.indexOf("import express from 'express';");
const topFunc = code.substring(0, importStart);
console.log("topFunc length:", topFunc.length);
console.log("Ends with:", topFunc.substring(topFunc.length - 20));
