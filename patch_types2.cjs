const fs = require('fs');
let typesCode = fs.readFileSync('src/types.ts', 'utf8');

typesCode = typesCode.replace(/trailingStopEnabled: boolean;/, "trailingStopEnabled: boolean;\n  trailingStopActivationPoints?: number;\n  trailingStopDistancePoints?: number;\n  trailingStopBreakEven?: boolean;\n  trailingStopBreakEvenOffset?: number;");
fs.writeFileSync('src/types.ts', typesCode);
