const fs = require('fs');
let code = fs.readFileSync('src/components/RiskSettingsPanel.tsx', 'utf8');

const oldStates = `  const [slPips, setSlPips] = useState<string>(
    String(botState?.riskConfig?.stopLossPips ?? '25')
  );
  const [tpPips, setTpPips] = useState<string>(
    String(botState?.riskConfig?.takeProfitPips ?? '35')
  );`;

const newStates = `  const [trailingStopEnabled, setTrailingStopEnabled] = useState(botState?.riskConfig?.trailingStopEnabled ?? true);
  const [trailingStopActivationPoints, setTrailingStopActivationPoints] = useState(String(botState?.riskConfig?.trailingStopActivationPoints ?? '20'));
  const [trailingStopDistancePoints, setTrailingStopDistancePoints] = useState(String(botState?.riskConfig?.trailingStopDistancePoints ?? '10'));
  const [trailingStopBreakEven, setTrailingStopBreakEven] = useState(botState?.riskConfig?.trailingStopBreakEven ?? true);
  const [trailingStopBreakEvenOffset, setTrailingStopBreakEvenOffset] = useState(String(botState?.riskConfig?.trailingStopBreakEvenOffset ?? '2'));`;

code = code.replace(oldStates, newStates);
fs.writeFileSync('src/components/RiskSettingsPanel.tsx', code);
