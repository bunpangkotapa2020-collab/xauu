const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(
    /<span className=\{\`font-bold text-sm md:text-base \$\{actionResult\.status === 'success' \? 'text-emerald-500' : 'text-red-500'\}\`\}>\s*\{actionResult\.status === 'success' \? '🟢 SUCCESS' : '🔴 FAILED'\}\s*<\/span>/g,
    `{actionResult.status === 'success' ? <CheckCircle2 size={32} className="mb-2 text-emerald-500"/> : <XOctagon size={32} className="mb-2 text-red-500"/>}
                     <span className={\`font-bold text-sm md:text-base \${actionResult.status === 'success' ? 'text-emerald-500' : 'text-red-500'}\`}>
                        {actionResult.status === 'success' ? '🟢 SUCCESS' : '🔴 FAILED'}
                     </span>`
);

fs.writeFileSync('src/components/MainDashboard.tsx', code);
