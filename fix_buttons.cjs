const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(
  '<span className="font-bold text-sm md:text-base">START</span>',
  '<span className="font-bold text-sm md:text-base text-center leading-tight">START<br/><span className="text-[10px] font-normal text-slate-500">(CONTINUOUS)</span></span>'
);

code = code.replace(
  '<span className="font-bold text-sm md:text-base">STOP</span>',
  '<span className="font-bold text-sm md:text-base text-center leading-tight">STOP<br/><span className="text-[10px] font-normal text-slate-500">(PAUSE ENTRIES)</span></span>'
);

code = code.replace(
  '<span className="font-bold text-center text-sm md:text-base leading-tight">CLOSE BOT TRADES</span>',
  '<span className="font-bold text-center text-sm md:text-base leading-tight">CLOSE BOT<br/><span className="text-[10px] font-normal text-slate-500">(MAGIC 778899 ONLY)</span></span>'
);

fs.writeFileSync('src/components/MainDashboard.tsx', code);
