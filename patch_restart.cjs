const fs = require('fs');
let code = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const target = `if (this.state.executedSetupIds.has(s.id)) {
            this.log("REJECT: Duplicate Setup ID execution prevented.");
            s.stage = 'INVALIDATED';
            return;
        }`;

const replacement = `if (this.state.executedSetupIds.has(s.id)) {
            this.log("REJECT: Duplicate Setup ID execution prevented.");
            s.stage = 'INVALIDATED';
            return;
        }
        
        // Restart Recovery: Check if there's already an open position with this setup ID
        if (this.state.openPositions.some(p => p.setupId === s.id)) {
            this.log("REJECT: Position for this setup already exists (survived restart).");
            this.state.executedSetupIds.add(s.id); // Re-sync
            s.stage = 'INVALIDATED';
            return;
        }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/MASTER_ICT_EA.ts', code);
    console.log("Restart recovery patched successfully.");
} else {
    console.log("Could not find target block to patch.");
}
