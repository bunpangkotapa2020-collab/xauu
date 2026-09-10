const fs = require('fs');
const path = require('path');

console.log("🛠️ កំពុងជួសជុលបញ្ហា Login Loop / លោតចេញវិញ (Fixing Dashboard Login)...");

// 1. Fix App.tsx race condition
const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
let appCode = fs.readFileSync(appTsxPath, 'utf-8');

if (!appCode.includes('currentToken !== existingToken')) {
  appCode = appCode.replace(
    /if \(session\.isUnauthorized\) \{\s*setIsLoggedIn\(false\);\s*setIsLoading\(false\);\s*fetchState\(\);\s*return;\s*\}/,
    `if (session.isUnauthorized) {
            // Check if user logged in while we were verifying
            const currentToken = authStorage.getToken();
            if (currentToken && currentToken !== existingToken) {
               console.log('Token changed during verification, ignoring unauthorized response');
               return;
            }
            setIsLoggedIn(false);
            setIsLoading(false);
            fetchState();
            return;
          }`
  );
  fs.writeFileSync(appTsxPath, appCode);
  console.log("✅ បានកែសម្រួល App.tsx (Fixed race condition)");
}

// 2. Add Error Boundary to App.tsx just in case of React crash
const errorBoundaryPath = path.join(__dirname, 'src', 'components', 'ErrorBoundary.tsx');
if (!fs.existsSync(errorBoundaryPath)) {
  fs.writeFileSync(errorBoundaryPath, `
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };
  public static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error('Uncaught error:', error, errorInfo); }
  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020817] text-slate-200 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-rose-500 mb-4">Dashboard Crash Detected</h1>
          <div className="bg-slate-900 p-4 rounded-xl border border-rose-500/30 max-w-2xl overflow-auto text-sm font-mono text-slate-400">
            {this.state.error?.toString()}
          </div>
          <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg">Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}
`);
  console.log("✅ បានបន្ថែម ErrorBoundary.tsx");
  
  if (!appCode.includes('ErrorBoundary')) {
    appCode = `import { ErrorBoundary } from "./components/ErrorBoundary";\n` + appCode;
    appCode = appCode.replace('<MainDashboard', '<ErrorBoundary>\n        <MainDashboard');
    appCode = appCode.replace('isStandalone={isStandalone}\n      />', 'isStandalone={isStandalone}\n      />\n      </ErrorBoundary>');
    fs.writeFileSync(appTsxPath, appCode);
    console.log("✅ បានបញ្ចូល ErrorBoundary ទៅក្នុង App.tsx");
  }
}

console.log("🔄 កំពុង Build ឯកសារថ្មី (Running npm run build)...");
const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("✅ Build ជោគជ័យ! សូម Restart PM2 ដោយប្រើបញ្ជាខាងក្រោម:");
  console.log("\n   pm2 restart all\n");
} catch (e) {
  console.error("❌ បរាជ័យក្នុងការ Build:", e.message);
}
