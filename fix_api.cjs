const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf-8');
code = code.replace(/if \(!res\.ok \|\| \(result && result\.error\) \|\| \(data && data\.error\)\) throw new Error\(([^)]+)\);/g, (match, errArg) => {
  if (errArg.includes('data.error')) {
    return `if (!res.ok || (typeof data !== 'undefined' && data.error)) throw new Error(${errArg});`;
  } else if (errArg.includes('result.error')) {
    return `if (!res.ok || (typeof result !== 'undefined' && result.error)) throw new Error(${errArg});`;
  } else {
    return `if (!res.ok) throw new Error(${errArg});`;
  }
});
fs.writeFileSync('src/services/api.ts', code);
