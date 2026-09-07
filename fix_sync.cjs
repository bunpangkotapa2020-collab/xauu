const fs = require('fs');
let content = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const oldLine = `        if (this.state.currentSetup && this.state.currentSetup.stage === 'TRIGGERED') {
            if (this.state.openPositions.length >= this.config.maxOpenTrades) {
                this.log("BLOCKED: MAX OPEN TRADES REACHED");
                this.telemetry.waitingReason = \`🟢 MAX OPEN TRADES REACHED (\${this.state.openPositions.length}/\${this.config.maxOpenTrades})\`;
                return;
            }
            await this.executeTrade(data);
        }
    }`;

const newLine = `        if (this.state.currentSetup && this.state.currentSetup.stage === 'TRIGGERED') {
            if (this.state.openPositions.length >= this.config.maxOpenTrades) {
                this.log("BLOCKED: MAX OPEN TRADES REACHED");
                this.telemetry.waitingReason = \`🟢 MAX OPEN TRADES REACHED (\${this.state.openPositions.length}/\${this.config.maxOpenTrades})\`;
                return;
            }
            await this.executeTrade(data);
        }

        if (this.state.currentSetup && this.telemetry.validSetup) {
            this.telemetry.validSetup.stage = this.state.currentSetup.stage;
            this.telemetry.validSetup.executionState = this.state.currentSetup.executionState;
        }
    }`;

content = content.replace(oldLine, newLine);
fs.writeFileSync('src/MASTER_ICT_EA.ts', content);
