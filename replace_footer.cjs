const fs = require('fs');
let content = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');
content = content.replace(/    <\/div>\n  \);/g, `      {/* Diagnostics Footer */}
      <div className="text-center pb-4 text-[10px] text-slate-500 font-mono">
        Last Sync: {new Date().toLocaleTimeString()} | Server Instance: {(state as any).serverId || 'N/A'}
      </div>
    </div>
  );`);
fs.writeFileSync('src/components/MainDashboard.tsx', content);
