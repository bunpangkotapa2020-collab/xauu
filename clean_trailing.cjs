const fs = require('fs');

// Clean types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/  trailingStopActivationPoints\?: number;\n  trailingStopDistancePoints\?: number;\n  trailingStopBreakEven\?: boolean;\n  trailingStopBreakEvenOffset\?: number;\n/g, "");
fs.writeFileSync('src/types.ts', types);

// Clean RiskSettingsPanel.tsx
let panel = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');
panel = panel.replace(/  const \[trailingStopActivationPoints, setTrailingStopActivationPoints\] = useState\(.*?\);\n/g, "");
panel = panel.replace(/  const \[trailingStopDistancePoints, setTrailingStopDistancePoints\] = useState\(.*?\);\n/g, "");
panel = panel.replace(/  const \[trailingStopBreakEven, setTrailingStopBreakEven\] = useState\(.*?\);\n/g, "");
panel = panel.replace(/  const \[trailingStopBreakEvenOffset, setTrailingStopBreakEvenOffset\] = useState\(.*?\);\n/g, "");

panel = panel.replace(/      if \(botState\.riskConfig\.trailingStopActivationPoints !== undefined\) \{\n        setTrailingStopActivationPoints\(String\(botState\.riskConfig\.trailingStopActivationPoints\)\);\n      \}\n/g, "");
panel = panel.replace(/      if \(botState\.riskConfig\.trailingStopDistancePoints !== undefined\) \{\n        setTrailingStopDistancePoints\(String\(botState\.riskConfig\.trailingStopDistancePoints\)\);\n      \}\n/g, "");
panel = panel.replace(/      if \(botState\.riskConfig\.trailingStopBreakEven !== undefined\) \{\n        setTrailingStopBreakEven\(botState\.riskConfig\.trailingStopBreakEven\);\n      \}\n/g, "");
panel = panel.replace(/      if \(botState\.riskConfig\.trailingStopBreakEvenOffset !== undefined\) \{\n        setTrailingStopBreakEvenOffset\(String\(botState\.riskConfig\.trailingStopBreakEvenOffset\)\);\n      \}\n/g, "");

panel = panel.replace(/      if \(botState\.riskConfig\.trailingStopActivationPoints !== undefined\) setTrailingStopActivationPoints\(String\(botState\.riskConfig\.trailingStopActivationPoints\)\);\n/g, "");
panel = panel.replace(/      if \(botState\.riskConfig\.trailingStopDistancePoints !== undefined\) setTrailingStopDistancePoints\(String\(botState\.riskConfig\.trailingStopDistancePoints\)\);\n/g, "");
panel = panel.replace(/      if \(botState\.riskConfig\.trailingStopBreakEven !== undefined\) setTrailingStopBreakEven\(botState\.riskConfig\.trailingStopBreakEven\);\n/g, "");
panel = panel.replace(/      if \(botState\.riskConfig\.trailingStopBreakEvenOffset !== undefined\) setTrailingStopBreakEvenOffset\(String\(botState\.riskConfig\.trailingStopBreakEvenOffset\)\);\n/g, "");

panel = panel.replace(/, botState\?.riskConfig\?.trailingStopActivationPoints, botState\?.riskConfig\?.trailingStopDistancePoints/g, "");

panel = panel.replace(/        trailingStopActivationPoints: Number\(trailingStopActivationPoints\),\n/g, "");
panel = panel.replace(/        trailingStopDistancePoints: Number\(trailingStopDistancePoints\),\n/g, "");
panel = panel.replace(/        trailingStopBreakEven,\n/g, "");
panel = panel.replace(/        trailingStopBreakEvenOffset: Number\(trailingStopBreakEvenOffset\)\n/g, "");

fs.writeFileSync('src/components/RiskSettingsPanel.tsx', panel);

// Clean server.ts config updates
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/      if \(riskConfig\.trailingStopActivationPoints !== undefined\) botState\.riskConfig\.trailingStopActivationPoints = Number\(riskConfig\.trailingStopActivationPoints\);\n/g, "");
server = server.replace(/      if \(riskConfig\.trailingStopDistancePoints !== undefined\) botState\.riskConfig\.trailingStopDistancePoints = Number\(riskConfig\.trailingStopDistancePoints\);\n/g, "");
server = server.replace(/      if \(riskConfig\.trailingStopBreakEven !== undefined\) botState\.riskConfig\.trailingStopBreakEven = Boolean\(riskConfig\.trailingStopBreakEven\);\n/g, "");
server = server.replace(/      if \(riskConfig\.trailingStopBreakEvenOffset !== undefined\) botState\.riskConfig\.trailingStopBreakEvenOffset = Number\(riskConfig\.trailingStopBreakEvenOffset\);\n/g, "");

server = server.replace(/    trailingStopActivationPoints: 20,\n    trailingStopDistancePoints: 10,\n    trailingStopBreakEven: true,\n    trailingStopBreakEvenOffset: 2,/g, "");

fs.writeFileSync('server.ts', server);

