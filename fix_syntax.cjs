const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// Find the index of "if (!pState) {"
let idx = code.indexOf("if (!pState) {");
if (idx !== -1) {
    // Find the end of the public checkProfitLock or trailing stop function block...
    // Actually it's easier to just splice it using lines.
}

let lines = code.split('\n');
let newLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("if (!pState) {")) {
        skip = true;
    }
    
    if (skip) {
        if (lines[i].includes("public processTrailingStop(")) {
            skip = false; // We reached the next function
        }
    }
    
    if (!skip) {
        newLines.push(lines[i]);
    }
}

fs.writeFileSync('src/MASTER_ICT_EA.ts', newLines.join('\n'));
