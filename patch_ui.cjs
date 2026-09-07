const fs = require('fs');

let svr = fs.readFileSync('server.ts', 'utf8');

// Add ticket to signalDetails 1
svr = svr.replace(/executionState: 'CONNECTION RECOVERING'/g,
                  "executionState: 'CONNECTION RECOVERING',\n               ticket: s.executionTicket");

// Add ticket to signalDetails 2
svr = svr.replace(/executionState: s\.executionState \|\| \(s\.stage === 'TRIGGERED' \? 'ENTRY TRIGGERED' : 'WAITING_RETRACEMENT'\),/g,
                  "executionState: s.executionState || (s.stage === 'TRIGGERED' ? 'ENTRY TRIGGERED' : 'WAITING_RETRACEMENT'),\n               ticket: s.executionTicket,");

fs.writeFileSync('server.ts', svr);
console.log("UI PATCH COMPLETE");
