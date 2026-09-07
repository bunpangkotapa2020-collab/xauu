const fs = require('fs');
let code = fs.readFileSync('server_original_from_map.ts', 'utf8');
const dotenvIndex = code.indexOf("dotenv.config();");
const rest = code.substring(dotenvIndex);
console.log("rest starts with:", JSON.stringify(rest.substring(0, 50)));
