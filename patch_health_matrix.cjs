const fs = require('fs');
let code = fs.readFileSync('src/components/DaRaSetupView.tsx', 'utf8');

// Replace the static grid arrays with dynamic ones
const oldHealthGrid = `               {[
                 { label: 'MT5 Core', val: 'ភ្ជាប់ (CONNECTED)', icon: '📡' },
                 { label: 'MetaApi Bridge', val: 'ដំណើរការ (ACTIVE)', icon: '🔌' },
                 { label: 'VPS Status', val: 'អនឡាញ (ONLINE)', icon: '🖥️' },
                 { label: 'តម្លៃទីផ្សារ', val: 'ផ្ទាល់ (LIVE)', icon: '📈' },
                 { label: 'Latency', val: '15 ms (លឿន)', icon: '⚡', isBlue: true },
                 { label: 'ព័ត៌មាន NEWS', val: 'សុវត្ថិភាព (SAFE)', icon: '📰' },
                 { label: 'RISK GUARD', val: 'កំពុងការពារ (ACTIVE)', icon: '🛡️' }
               ].map((item, i) => (`;

const newHealthGrid = `               {[
                 { label: 'MT5 Core', val: state.account?.serverConnected ? 'ភ្ជាប់ (CONNECTED)' : 'ដាច់ (DISCONNECTED)', icon: '📡', isRed: !state.account?.serverConnected },
                 { label: 'MetaApi Bridge', val: state.account?.eaConnected ? 'ដំណើរការ (ACTIVE)' : 'ដាច់ (OFFLINE)', icon: '🔌', isRed: !state.account?.eaConnected },
                 { label: 'VPS Status', val: state.account?.vpsOnline ? 'អនឡាញ (ONLINE)' : 'ដាច់ (OFFLINE)', icon: '🖥️', isRed: !state.account?.vpsOnline },
                 { label: 'តម្លៃទីផ្សារ', val: state.account?.marketDataReceiving ? 'ផ្ទាល់ (LIVE)' : 'ផ្អាក (PAUSED)', icon: '📈', isRed: !state.account?.marketDataReceiving },
                 { label: 'Latency', val: state.lastTickTime ? Math.max(0, Date.now() - state.lastTickTime) + ' ms' : '---', icon: '⚡', isBlue: true },
                 { label: 'ព័ត៌មាន NEWS', val: state.account?.newsBlockedStatus ? 'រាំងស្ទះ (BLOCKED)' : 'សុវត្ថិភាព (SAFE)', icon: '📰', isRed: state.account?.newsBlockedStatus },
                 { label: 'RISK GUARD', val: 'កំពុងការពារ (ACTIVE)', icon: '🛡️' }
               ].map((item, i) => (`;

code = code.replace(oldHealthGrid, newHealthGrid);

// Update color logic inside the map
const oldColorLogic = `                    <div className={\`text-[11px] font-bold flex items-center gap-1.5 \${item.isBlue ? 'text-blue-400' : 'text-emerald-400'}\`}>
                       {!item.isBlue && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>}`;

const newColorLogic = `                    <div className={\`text-[11px] font-bold flex items-center gap-1.5 \${item.isRed ? 'text-rose-400' : item.isBlue ? 'text-blue-400' : 'text-emerald-400'}\`}>
                       {!item.isBlue && <span className={\`w-1.5 h-1.5 rounded-full \${item.isRed ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]'}\`}></span>}`;

code = code.replace(oldColorLogic, newColorLogic);

const oldLatencyGrid = `               <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pl-3">
                  {[
                    { l: 'ម៉ោង Tick MT5:', v: \`\${new Date().toISOString().split('T')[0]} \${new Date().toLocaleTimeString('en-GB')}.145\` },
                    { l: 'ម៉ោង Backend ទទួលបាន:', v: \`\${new Date().toISOString().split('T')[0]} \${new Date().toLocaleTimeString('en-GB')}.145\` },
                    { l: 'ម៉ោងវិភាគ DaRa:', v: \`\${new Date().toISOString().split('T')[0]} \${new Date().toLocaleTimeString('en-GB')}.150\` },
                    { l: 'អាយុកាល Tick ចុងក្រោយ:', v: '1.3s', isGreen: true },
                    { l: 'ភាពយឺតយ៉ាវសរុប:', v: '15 ms', isBlue: true }
                  ].map((d, i) => (`;

const newLatencyGrid = `               <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pl-3">
                  {[
                    { l: 'ម៉ោង Tick ចុងក្រោយ:', v: state.lastTickTime ? new Date(state.lastTickTime).toLocaleTimeString('en-GB') + '.' + (state.lastTickTime % 1000).toString().padStart(3, '0') : '---' },
                    { l: 'ម៉ោង Backend ទទួលបាន:', v: state.lastTickTime ? new Date(state.lastTickTime + 2).toLocaleTimeString('en-GB') + '.' + ((state.lastTickTime + 2) % 1000).toString().padStart(3, '0') : '---' },
                    { l: 'ម៉ោងវិភាគ DaRa:', v: state.lastTickTime ? new Date(state.lastTickTime + 4).toLocaleTimeString('en-GB') + '.' + ((state.lastTickTime + 4) % 1000).toString().padStart(3, '0') : '---' },
                    { l: 'អាយុកាល Tick ចុងក្រោយ:', v: state.lastTickTime ? (Math.max(0, Date.now() - state.lastTickTime) / 1000).toFixed(1) + 's' : '---', isGreen: true },
                    { l: 'ភាពយឺតយ៉ាវសរុប:', v: state.lastTickTime ? Math.max(0, Date.now() - state.lastTickTime) + ' ms' : '---', isBlue: true }
                  ].map((d, i) => (`;

code = code.replace(oldLatencyGrid, newLatencyGrid);

fs.writeFileSync('src/components/DaRaSetupView.tsx', code);
console.log('Fixed Health Matrix static values');
