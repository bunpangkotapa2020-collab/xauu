const fs = require('fs');
let content = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

// BUY block
content = content.replace(
`            const risk = entry - sl;
            if (risk < this.config.minSLPoints) {
                this.log(\`REJECT: Minimum SL < \${this.config.minSLPoints}\`);
                s.executionState = \`REJECTED: MIN_SL_VIOLATION (< \${this.config.minSLPoints})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }`,
`            const risk = entry - sl;
            // Removed unauthorized minSLPoints rejection gate`
);

// SELL block
content = content.replace(
`            const risk = sl - entry;
            if (risk < this.config.minSLPoints) {
                this.log(\`REJECT: Minimum SL < \${this.config.minSLPoints}\`);
                s.executionState = \`REJECTED: MIN_SL_VIOLATION (< \${this.config.minSLPoints})\`;
                s.stage = 'INVALIDATED';
                this.state.executedSetupIds.add(s.id);
                return;
            }`,
`            const risk = sl - entry;
            // Removed unauthorized minSLPoints rejection gate`
);

fs.writeFileSync('src/MASTER_ICT_EA.ts', content);
