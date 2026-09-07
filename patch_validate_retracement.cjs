const fs = require('fs');
let content = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const oldBullishInvalid = `        if (s.bias === 'BULLISH' && data.bid < s.obLow) {
            this.log(\`INVALID OB/SETUP: Price broke below Bullish OB Low (\${s.obLow}). Stage -> INVALIDATED\`);
            this.addAnalysisLog(\`Setup \${s.id} បានបរាជ័យ (Price broke below OB Low \${s.obLow}) -> INVALIDATED\`, 'warn');
            s.executionState = 'REJECTED: PRICE_BROKE_OB';
            s.stage = 'INVALIDATED';
            this.state.executedSetupIds.add(s.id);
            return;
        }`;

const newBullishInvalid = `        if (s.bias === 'BULLISH' && data.bid < s.obLow) {
            this.log(\`=== RETRACEMENT DIAGNOSTIC (BULLISH) ===\`);
            this.log(\`Setup ID: \${s.id}\`);
            this.log(\`Direction: \${s.bias}\`);
            this.log(\`OB High: \${s.obHigh}\`);
            this.log(\`OB Low: \${s.obLow}\`);
            this.log(\`Current Ask: \${data.ask}\`);
            this.log(\`Current Bid: \${data.bid}\`);
            this.log(\`Condition: data.bid < s.obLow (\${data.bid} < \${s.obLow}) => TRUE\`);
            this.log(\`========================================\`);
            this.log(\`INVALID OB/SETUP: Price broke below Bullish OB Low (\${s.obLow}). Stage -> INVALIDATED\`);
            this.addAnalysisLog(\`Setup \${s.id} បានបរាជ័យ (Price broke below OB Low \${s.obLow}) -> INVALIDATED\`, 'warn');
            s.executionState = 'REJECTED: PRICE_BROKE_OB';
            s.stage = 'INVALIDATED';
            this.state.executedSetupIds.add(s.id);
            return;
        }`;

const oldBearishInvalid = `        if (s.bias === 'BEARISH' && data.ask > s.obHigh) {
            this.log(\`INVALID OB/SETUP: Price broke above Bearish OB High (\${s.obHigh}). Stage -> INVALIDATED\`);
            this.addAnalysisLog(\`Setup \${s.id} បានបរាជ័យ (Price broke above OB High \${s.obHigh}) -> INVALIDATED\`, 'warn');
            s.executionState = 'REJECTED: PRICE_BROKE_OB';
            s.stage = 'INVALIDATED';
            this.state.executedSetupIds.add(s.id);
            return;
        }`;

const newBearishInvalid = `        if (s.bias === 'BEARISH' && data.ask > s.obHigh) {
            this.log(\`=== RETRACEMENT DIAGNOSTIC (BEARISH) ===\`);
            this.log(\`Setup ID: \${s.id}\`);
            this.log(\`Direction: \${s.bias}\`);
            this.log(\`OB High: \${s.obHigh}\`);
            this.log(\`OB Low: \${s.obLow}\`);
            this.log(\`Current Ask: \${data.ask}\`);
            this.log(\`Current Bid: \${data.bid}\`);
            this.log(\`Condition: data.ask > s.obHigh (\${data.ask} > \${s.obHigh}) => TRUE\`);
            this.log(\`========================================\`);
            this.log(\`INVALID OB/SETUP: Price broke above Bearish OB High (\${s.obHigh}). Stage -> INVALIDATED\`);
            this.addAnalysisLog(\`Setup \${s.id} បានបរាជ័យ (Price broke above OB High \${s.obHigh}) -> INVALIDATED\`, 'warn');
            s.executionState = 'REJECTED: PRICE_BROKE_OB';
            s.stage = 'INVALIDATED';
            this.state.executedSetupIds.add(s.id);
            return;
        }`;

content = content.replace(oldBullishInvalid, newBullishInvalid);
content = content.replace(oldBearishInvalid, newBearishInvalid);
fs.writeFileSync('src/MASTER_ICT_EA.ts', content);
console.log("Patched validateRetracement in MASTER_ICT_EA.ts");
