const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const profileStr = `
export interface AutoRiskProfile {
  riskPerTradePercent: number;
  maxLossPerTrade: number;
  maxDailyLoss: number;
  maxDrawdownPercent: number;
  lotSize: number;
  lotPerEntry: number;
  tpPips: number;
  slPips: number;
  riskRewardRatio: string;
}
`;

if (!code.includes('AutoRiskProfile')) {
  code = code.replace('export interface BotState {', profileStr + '\nexport interface BotState {\n  autoRiskProfile?: AutoRiskProfile;');
  fs.writeFileSync('src/types.ts', code);
}
console.log('Types updated');
