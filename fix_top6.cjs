const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const start = code.indexOf("xpress';");
const end = code.indexOf("process.env[key] = value;\n}", start) + "process.env[key] = value;\n}".length;

if (start > -1 && end > -1) {
    code = code.substring(0, start) + code.substring(end);
    fs.writeFileSync('server.ts', code);
    console.log("Removed duplicated imports and function!");
}
