import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020817] text-slate-200 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-rose-500 mb-4">Dashboard Crash Detected</h1>
          <div className="bg-slate-900 p-4 rounded-xl border border-rose-500/30 max-w-2xl overflow-auto text-sm font-mono text-slate-400">
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
