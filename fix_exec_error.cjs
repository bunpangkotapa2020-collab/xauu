const fs = require('fs');
let code = fs.readFileSync('src/engines/dara_m1/DaRaOrderExecution.ts', 'utf-8');

const target = `        return {
          success: false,
          error: \`Broker Rejection: \${brokerResponse.error || 'Execution failed'}\`
        };`;
const replacement = `        return {
          success: false,
          error: \`Broker Rejection: \${brokerResponse.error || 'Execution failed'}\`
        };`;

// already has a fallback. Let's make sure it handles objects.
code = code.replace(
  "error: `Broker Rejection: ${brokerResponse.error || 'Execution failed'}`",
  "error: `Broker Rejection: ${typeof brokerResponse.error === 'object' ? JSON.stringify(brokerResponse.error) : brokerResponse.error || 'Execution failed'}`"
);

fs.writeFileSync('src/engines/dara_m1/DaRaOrderExecution.ts', code);
console.log("✅ Fixed DaRaOrderExecution error formatting");
