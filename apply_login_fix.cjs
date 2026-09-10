const fs = require('fs');

// 1. Fix server.ts (Security Bypass & Logging)
let serverCode = fs.readFileSync('server.ts', 'utf-8');
serverCode = serverCode.replace(
  "if (user && user.role !== 'admin') {",
  "if (!user || user.role !== 'admin') {"
);
serverCode = serverCode.replace(
  "return res.status(401).json({ valid: false, error: 'Session អស់សុពលភាព' });",
  "console.error('401 Unauthorized triggered! Auth Header:', req.headers.authorization, 'Payload:', (req as any).user);\n      return res.status(401).json({ valid: false, error: 'Session អស់សុពលភាព' });"
);
fs.writeFileSync('server.ts', serverCode);

// 2. Fix api.ts (Broken Error Handling)
let apiCode = fs.readFileSync('src/services/api.ts', 'utf-8');
apiCode = apiCode.replace(/if \(!res\.ok \|\| \(result && result\.error\) \|\| \(data && data\.error\)\) throw new Error\(([^)]+)\);/g, (match, errArg) => {
  if (errArg.includes('data.error')) {
    return `if (!res.ok || (typeof data !== 'undefined' && data.error)) throw new Error(${errArg});`;
  } else if (errArg.includes('result.error')) {
    return `if (!res.ok || (typeof result !== 'undefined' && result.error)) throw new Error(${errArg});`;
  } else {
    return `if (!res.ok) throw new Error(${errArg});`;
  }
});
apiCode = apiCode.replace(/if \(false\) throw new Error\(([^)]+)\);/g, (match, errArg) => {
  if (errArg.includes('data.error')) {
    return `if (!res.ok || (typeof data !== 'undefined' && data.error)) throw new Error(${errArg});`;
  } else if (errArg.includes('result.error')) {
    return `if (!res.ok || (typeof result !== 'undefined' && result.error)) throw new Error(${errArg});`;
  } else {
    return `if (!res.ok) throw new Error(${errArg});`;
  }
});
fs.writeFileSync('src/services/api.ts', apiCode);

console.log("Fixes applied successfully!");
