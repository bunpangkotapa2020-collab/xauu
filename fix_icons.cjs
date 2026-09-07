const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(
  "import { Play, Pause, Square, XOctagon, LogOut, CheckCircle2, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';",
  "import { Play, Pause, Square, XOctagon, LogOut, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, Sparkles, ShieldCheck } from 'lucide-react';"
);

fs.writeFileSync('src/components/MainDashboard.tsx', code);
console.log('Icons fixed');
