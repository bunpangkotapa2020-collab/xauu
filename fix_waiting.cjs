const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const balanceRegex = /<div className="text-3xl md:text-4xl font-black text-white font-mono flex items-baseline gap-2">[\s\S]*?<\/div>/;
const newBalance = `{state.account.balance > 0 ? (
                <div className="text-3xl md:text-4xl font-black text-white font-mono flex items-baseline gap-2">
                  {(state.account.balance || 0).toLocaleString()} <span className="text-sm md:text-lg text-amber-400">{state.account.currency}</span>
                </div>
              ) : (
                <div className="text-sm md:text-base text-slate-500 italic font-medium animate-pulse py-2">
                  Waiting for Real MT5 Data...
                </div>
              )}`;

if (balanceRegex.test(code)) {
    code = code.replace(balanceRegex, newBalance);
    fs.writeFileSync('src/components/MainDashboard.tsx', code);
    console.log('Balance UI fixed');
} else {
    console.log('Balance Regex not found');
}
