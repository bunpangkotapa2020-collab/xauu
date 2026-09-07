const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const equityRegex = /<strong className="text-white font-mono">\{\(state\.account\.equity \|\| 0\)\.toLocaleString\(\)\} \{state\.account\.currency\}<\/strong>/;
const newEquity = `<strong className="text-white font-mono">{state.account.equity > 0 ? (state.account.equity.toLocaleString() + ' ' + state.account.currency) : 'WAITING...'}</strong>`;

const marginRegex = /<strong className="text-white font-mono">\{\(state\.account\.freeMargin \|\| 0\)\.toLocaleString\(\)\} \{state\.account\.currency\}<\/strong>/;
const newMargin = `<strong className="text-white font-mono">{state.account.freeMargin > 0 ? (state.account.freeMargin.toLocaleString() + ' ' + state.account.currency) : 'WAITING...'}</strong>`;

if (equityRegex.test(code)) {
    code = code.replace(equityRegex, newEquity);
    console.log('Equity UI fixed');
}
if (marginRegex.test(code)) {
    code = code.replace(marginRegex, newMargin);
    console.log('Margin UI fixed');
}

fs.writeFileSync('src/components/MainDashboard.tsx', code);
