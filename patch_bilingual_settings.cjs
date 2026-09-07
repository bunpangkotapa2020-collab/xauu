const fs = require('fs');

let code = fs.readFileSync('src/components/BotSettingsModal.tsx', 'utf8');

// Replacements mapping
const replacements = [
  { from: '>Lot Size<', to: '>Lot Size / ទំហំ Lot<' },
  { from: '>Max Open Trades<', to: '>Max Open Trades / ចំនួន Trade អតិបរមា<' },
  { from: '>Stop Loss (Distance / Points)<', to: '>Stop Loss (Points) / កាត់ខាត<' },
  { from: '>Take Profit (Distance / Points)<', to: '>Take Profit (Points) / យកចំណេញ<' },
  { from: '>Daily Loss Limit (USC)<', to: '>Daily Loss Limit (USC) / ដែនកំណត់ខាតប្រចាំថ្ងៃ<' },
  { from: '>Max Consecutive SL (Trades)<', to: '>Max Consecutive SL / ខាតជាប់គ្នាអតិបរមា<' },
  { from: '>Cooldown After SL (Minutes)<', to: '>Cooldown After SL (Minutes) / ផ្អាកបន្ទាប់ពីខាត<' },
  { from: 'Cancel\n          </button>', to: 'Cancel / បោះបង់\n          </button>' },
  { from: 'Save Configuration\n          </button>', to: 'Save Configuration / រក្សាទុក\n          </button>' }
];

for (const rep of replacements) {
  code = code.replace(rep.from, rep.to);
}

fs.writeFileSync('src/components/BotSettingsModal.tsx', code);
console.log('BotSettingsModal patched.');
