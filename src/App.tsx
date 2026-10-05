import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Settings, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  Play, 
  Square,
  Webhook,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Database,
  Cpu,
  Monitor
} from 'lucide-react';
import { BotState, UserSettings, AuditLog } from './types';

function App() {
  const [state, setState] = useState<BotState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings' | 'broker'>('dashboard');
  const [testingConnection, setTestingConnection] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setState(data);
      setError(null);
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to update settings');
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch('/api/broker/test', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      fetchData();
    } catch (err) {
      alert('Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const emergencyStop = async () => {
    if (confirm('ACTIVATE EMERGENCY STOP? New orders will be blocked.')) {
      await fetch('/api/emergency/stop', { method: 'POST' });
      fetchData();
    }
  };

  const emergencyCloseAll = async () => {
    if (confirm('EMERGENCY CLOSE ALL POSITIONS? This will close all open trades on the broker and stop trading.')) {
      const res = await fetch('/api/emergency/close-all', { method: 'POST' });
      const data = await res.json();
      alert(`Closed ${data.closedCount} positions. ${data.errors ? data.errors.join(', ') : ''}`);
      fetchData();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Activity className="animate-spin text-amber-500" size={48} />
        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing DaRa M1 Production Engine...</span>
      </div>
    </div>
  );

  const isLive = state?.settings.tradingMode === 'LIVE';
  const isEmergency = state?.settings.emergencyStop;
  const isTradingEnabled = state?.settings.tradingEnabled;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Zap className="text-amber-500 fill-amber-500" size={32} />
              <h1 className="text-3xl font-black tracking-tighter text-white">
                DARA M1 <span className="text-amber-500/50 font-medium text-lg tracking-normal uppercase">Fresh Build v1.0</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
               <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isLive ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}>
                 {isLive ? 'Live Mode' : 'Paper Mode'}
               </span>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Signal Execution Infrastructure</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-4 py-2 rounded-full border ${isTradingEnabled ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'} flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-lg`}>
              <div className={`w-2 h-2 rounded-full ${isTradingEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
              {isTradingEnabled ? 'Trading Active' : 'Trading Stopped'}
            </div>
            
            {isLive && (
              <div className={`px-4 py-2 rounded-full border ${state?.settings.metaApi.connected ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'} flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg`}>
                <Database size={14} />
                {state?.settings.metaApi.connected ? 'Broker Connected' : 'Broker Offline'}
              </div>
            )}

            <div className={`px-4 py-2 rounded-full border ${state?.isInsideTradingWindow ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'} flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg`}>
              <Clock size={14} />
              {state?.isInsideTradingWindow ? 'Window Open' : 'Window Closed'}
            </div>
          </div>
        </header>

        {/* EMERGENCY BANNER */}
        {isEmergency && (
          <div className="bg-rose-600/20 border border-rose-500/50 p-4 rounded-2xl mb-8 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4 text-rose-400">
               <AlertTriangle size={32} />
               <div>
                  <h4 className="font-black uppercase tracking-widest text-sm">Emergency System Lock Active</h4>
                  <p className="text-xs font-bold opacity-80 uppercase tracking-tighter">New signals are being blocked. Please resolve issues before resuming.</p>
               </div>
            </div>
            <button 
              onClick={() => updateSettings({ emergencyStop: false })}
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all"
            >
              Reset Lock
            </button>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <nav className="flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 w-fit shadow-2xl">
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity size={16} />} label="Dashboard" />
            <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={16} />} label="Signal Logs" />
            <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={16} />} label="Risk Engine" />
            <NavButton active={activeTab === 'broker'} onClick={() => setActiveTab('broker')} icon={<Database size={16} />} label="Broker Config" />
          </nav>

          <div className="flex items-center gap-3">
             <button 
               onClick={emergencyStop}
               className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center gap-2"
             >
               <AlertTriangle size={16} /> Stop New Trades
             </button>
             <button 
               onClick={emergencyCloseAll}
               className="bg-rose-500/10 border border-rose-500/30 text-rose-500 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center gap-2"
             >
               <XCircle size={16} /> Close All Now
             </button>
          </div>
        </div>

        {/* CONTENT */}
        {error && (
          <div className="bg-rose-500/20 border border-rose-500/50 text-rose-400 p-4 rounded-xl flex items-center gap-3 mb-8 shadow-2xl">
            <AlertCircle size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
          </div>
        )}

        {activeTab === 'dashboard' && state && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* SIGNAL STATUS */}
              <section className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Webhook size={200} />
                </div>
                
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tight">
                  <div className="p-3 bg-blue-500/20 rounded-2xl">
                    <Webhook className="text-blue-400" size={28} />
                  </div>
                  Signal Intake Engine
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <StatusItem label="Ingress Status" value="Online & Secured" color="text-emerald-400" icon={<CheckCircle2 size={14} />} />
                    <StatusItem label="Last External ID" value={state.signalHistory[0]?.signal_id || 'Waiting for TV...'} mono />
                    <StatusItem label="Signal Action" value={state.signalHistory[0]?.action || 'N/A'} highlight color={state.signalHistory[0]?.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'} />
                    <StatusItem label="Ingress Price" value={state.signalHistory[0]?.tv_price?.toFixed(2) || '0.00'} mono />
                  </div>
                  <div className="space-y-8">
                    <StatusItem label="Auth Result" value={state.signalHistory[0]?.auth_result === 'PASS' ? 'SECURED' : 'N/A'} color={state.signalHistory[0]?.auth_result === 'PASS' ? 'text-emerald-400' : 'text-slate-500'} />
                    <StatusItem label="Deduplication" value={state.signalHistory[0]?.duplicate_result === 'PASS' ? 'UNIQUE' : 'N/A'} color={state.signalHistory[0]?.duplicate_result === 'PASS' ? 'text-emerald-400' : 'text-amber-400'} />
                    <StatusItem label="Final Status" value={state.signalHistory[0]?.execution_status || 'IDLE'} highlight color={getStatusColor(state.signalHistory[0]?.execution_status)} />
                    <StatusItem label="Block Insight" value={state.signalHistory[0]?.block_reason || 'NO BLOCKS'} color={state.signalHistory[0]?.block_reason ? 'text-rose-400' : 'text-slate-500'} />
                  </div>
                </div>
              </section>

              {/* ACTIVE POSITIONS */}
              <section className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-black text-white flex items-center gap-4 uppercase tracking-tight">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl">
                      <TrendingUp className="text-emerald-400" size={28} />
                    </div>
                    Active Broker Inventory
                  </h3>
                  <button onClick={fetchData} className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-500 hover:text-white">
                    <RefreshCw size={20} />
                  </button>
                </div>
                
                {state.openPositions.length > 0 ? (
                  <div className="space-y-6">
                    {state.openPositions.map(pos => (
                      <div key={pos.ticket} className="bg-slate-950/50 border border-slate-800/50 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition-all group shadow-xl">
                        <div className="flex items-center gap-6">
                          <div className={`p-4 rounded-2xl shadow-inner ${pos.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {pos.action === 'BUY' ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-xl text-white tracking-tighter">{pos.symbol}</span>
                              <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-black tracking-widest uppercase">ID: {pos.ticket}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                               <Monitor size={12} /> {pos.lotSize} LOT <span className="opacity-30">•</span> FILL: {pos.openPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-10 px-6 border-l border-slate-800/50 h-full">
                           <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Protection</p>
                              <p className="text-sm font-mono text-slate-300">SL: {pos.sl.toFixed(2)} <span className="text-slate-700">|</span> TP: {pos.tp.toFixed(2)}</p>
                           </div>
                           <div className="text-right min-w-[120px]">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Real-time P/L</p>
                              <div className={`text-2xl font-black tracking-tighter ${pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)} <span className="text-xs uppercase opacity-50">USC</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-600 border-2 border-dashed border-slate-800/50 rounded-[2rem] bg-slate-950/20">
                    <Shield size={64} className="mb-6 opacity-10" />
                    <span className="text-sm font-black uppercase tracking-[0.3em] opacity-40">No active positions on broker</span>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-8">
              {/* SYSTEM CONTROL */}
              <section className={`bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden ${isLive ? 'ring-1 ring-rose-500/20' : 'ring-1 ring-blue-500/20'}`}>
                {isLive && <div className="absolute top-0 right-0 p-4"><div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div></div>}
                
                <h3 className="text-xl font-black text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                   {isLive ? <Cpu className="text-rose-400" /> : <Monitor className="text-blue-400" />}
                   Execution Control
                </h3>

                <div className="space-y-8">
                  <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                     <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Architecture</p>
                        <p className={`text-sm font-black uppercase tracking-widest ${isLive ? 'text-rose-400' : 'text-blue-400'}`}>
                           {isLive ? 'Production MetaAPI' : 'In-Memory Paper'}
                        </p>
                     </div>
                     <button 
                        onClick={() => {
                           if (!isLive && (!state.settings.metaApi.token || !state.settings.metaApi.accountId)) {
                              alert('Configure MetaAPI Credentials first!');
                              setActiveTab('broker');
                              return;
                           }
                           updateSettings({ tradingMode: isLive ? 'PAPER' : 'LIVE' });
                        }}
                        className={`p-3 rounded-xl transition-all shadow-lg ${isLive ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}
                     >
                        <RefreshCw size={20} />
                     </button>
                  </div>

                  <div className="pt-4 space-y-4">
                    <button 
                      onClick={() => updateSettings({ tradingEnabled: !isTradingEnabled })}
                      className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 transition-all shadow-2xl ${isTradingEnabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'}`}
                    >
                      {isTradingEnabled ? <Square size={20} fill="white" /> : <Play size={20} fill="white" />}
                      {isTradingEnabled ? 'Deactivate Engine' : 'Activate Engine'}
                    </button>
                    
                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest px-4 leading-relaxed">
                      {isTradingEnabled ? 
                        (isLive ? 'CRITICAL: Real broker orders are active.' : 'Paper orders are simulated in memory.') : 
                        'Engine is in STANDBY mode. Signals are logged but blocked.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* QUICK RISK STATUS */}
              <section className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl">
                 <h3 className="text-sm font-black text-slate-500 mb-8 uppercase tracking-widest flex items-center gap-3">
                   <Shield size={16} /> Risk Guardian
                 </h3>
                 <div className="space-y-6">
                    <RiskItem label="Session P/L" value={`${state.dailyPnL.toFixed(2)} USC`} color={state.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                    <RiskItem label="Trade Count" value={`${state.dailyTradeCount} / ${state.settings.dailyTradeLimit}`} />
                    <RiskItem label="Lot Size" value={`${state.settings.lotSize}`} />
                    <RiskItem label="Max Exposure" value={`${state.settings.maxOpenPositions} Pos`} />
                 </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'history' && state && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
               <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                 <History className="text-amber-400" />
                 Signal Audit Trail
               </h3>
               <button onClick={fetchData} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 transition-all">Refresh Logs</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                    <th className="px-10 py-6">Timestamp</th>
                    <th className="px-10 py-6">Signal Source ID</th>
                    <th className="px-10 py-6">Action</th>
                    <th className="px-10 py-6">Price</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6">Broker Insight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {state.signalHistory.map((log: AuditLog, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/10 transition-colors group">
                      <td className="px-10 py-6 text-xs font-mono text-slate-500">{log.timestamp.split('T')[1].split('.')[0]}</td>
                      <td className="px-10 py-6 text-xs font-mono text-white group-hover:text-blue-400 transition-colors">{log.signal_id}</td>
                      <td className="px-10 py-6">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${log.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-xs font-mono text-slate-300">{log.tv_price.toFixed(2)}</td>
                      <td className="px-10 py-6">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(log.execution_status)}`}>
                          {log.execution_status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-xs text-slate-500 font-bold italic group-hover:text-slate-400 transition-colors">
                        {log.block_reason || log.error_reason || (log.broker_ticket ? `Filled @ ${log.actual_fill_price?.toFixed(2)} [TKT: ${log.broker_ticket}]` : '-')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && state && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* CORE RISK CONFIG */}
             <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-10 uppercase tracking-tight flex items-center gap-4">
                  <Shield className="text-amber-400" />
                  Risk Engine Params
                </h3>
                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-8">
                      <SettingInput label="Execution Lot" value={state.settings.lotSize} type="number" step="0.01" onChange={(v: string) => updateSettings({ lotSize: parseFloat(v) })} />
                      <SettingInput label="Max Positions" value={state.settings.maxOpenPositions} type="number" onChange={(v: string) => updateSettings({ maxOpenPositions: parseInt(v) })} />
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <SettingInput label="Stop Loss (Pips)" value={state.settings.slPips} type="number" onChange={(v: string) => updateSettings({ slPips: parseInt(v) })} color="text-rose-400" border="focus:border-rose-500" />
                      <SettingInput label="Take Profit (Pips)" value={state.settings.tpPips} type="number" onChange={(v: string) => updateSettings({ tpPips: parseInt(v) })} color="text-emerald-400" border="focus:border-emerald-500" />
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <SettingInput label="Daily Trade Limit" value={state.settings.dailyTradeLimit} type="number" onChange={(v: string) => updateSettings({ dailyTradeLimit: parseInt(v) })} />
                      <SettingInput label="Daily Loss Limit (USC)" value={state.settings.dailyLossLimit} type="number" onChange={(v: string) => updateSettings({ dailyLossLimit: parseInt(v) })} color="text-rose-400" />
                   </div>
                   <div className="space-y-4 pt-4 border-t border-slate-800/50">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trading Hours Scheduler</label>
                         <button 
                            onClick={() => updateSettings({ tradingHours: { ...state.settings.tradingHours, enabled: !state.settings.tradingHours.enabled } })}
                            className={`p-2 rounded-lg transition-all ${state.settings.tradingHours.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}
                         >
                            {state.settings.tradingHours.enabled ? <Unlock size={16} /> : <Lock size={16} />}
                         </button>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                         <SettingInput label="Start (UTC HH:MM)" value={state.settings.tradingHours.startHour} type="text" onChange={(v: string) => updateSettings({ tradingHours: { ...state.settings.tradingHours, startHour: v } })} />
                         <SettingInput label="Stop (UTC HH:MM)" value={state.settings.tradingHours.stopHour} type="text" onChange={(v: string) => updateSettings({ tradingHours: { ...state.settings.tradingHours, stopHour: v } })} />
                      </div>
                   </div>
                </div>
             </div>

             {/* SYMBOL MAPPING */}
             <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-10 uppercase tracking-tight flex items-center gap-4">
                  <RefreshCw className="text-blue-400" />
                  Symbol Mapping Engine
                </h3>
                <div className="space-y-6">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Map TradingView Tickers to your MT5 Broker Symbols (JSON Format):</p>
                   <textarea 
                    defaultValue={JSON.stringify(state.settings.symbolMapping, null, 2)} 
                    onBlur={(e) => {
                      try { updateSettings({ symbolMapping: JSON.parse(e.target.value) }); } catch(e) { alert('Invalid JSON Mapping'); }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-6 text-blue-400 font-mono text-sm h-[320px] focus:border-blue-500 outline-none transition-all shadow-inner" 
                   />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'broker' && state && (
          <div className="max-w-3xl bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-12 shadow-2xl mx-auto">
             <div className="flex items-center justify-between mb-12">
                <h3 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-5">
                  <Database className="text-emerald-400" size={32} />
                  MetaAPI Infrastructure
                </h3>
                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-xs font-black uppercase tracking-widest ${state.settings.metaApi.connected ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'}`}>
                   {state.settings.metaApi.status}
                </div>
             </div>
             
             <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <SettingInput label="MetaAPI Account ID" value={state.settings.metaApi.accountId} type="text" onChange={(v: string) => updateSettings({ metaApi: { ...state.settings.metaApi, accountId: v } })} placeholder="Enter Account ID" />
                   <SettingInput label="MetaAPI Region" value={state.settings.metaApi.region} type="text" onChange={(v: string) => updateSettings({ metaApi: { ...state.settings.metaApi, region: v } })} placeholder="e.g. new-york" />
                </div>
                
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MetaAPI Provisioning Token</label>
                   <input 
                    type="password" 
                    defaultValue={state.settings.metaApi.token} 
                    onBlur={(e) => updateSettings({ metaApi: { ...state.settings.metaApi, token: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono focus:border-amber-500 outline-none transition-all shadow-inner"
                    placeholder="Enter MetaAPI Token"
                   />
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Credentials are encrypted and never exposed in logs.</p>
                </div>

                <div className="pt-8 border-t border-slate-800/50 flex flex-col gap-6">
                   <button 
                    disabled={testingConnection}
                    onClick={testConnection}
                    className="w-full py-5 rounded-3xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
                   >
                     {testingConnection ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                     {testingConnection ? 'Validating Connection...' : 'Test Connection & Sync Broker'}
                   </button>
                   
                   {state.settings.metaApi.error && (
                      <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold leading-relaxed flex items-start gap-4">
                         <AlertCircle size={18} className="shrink-0" />
                         <span>{state.settings.metaApi.error}</span>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${active ? 'bg-slate-800 text-white shadow-xl ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {icon} {label}
    </button>
  );
}

function StatusItem({ label, value, color = 'text-slate-300', mono = false, highlight = false, icon }: { label: string, value: string, color?: string, mono?: boolean, highlight?: boolean, icon?: React.ReactNode }) {
  return (
    <div className="relative">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
         {icon} {label}
      </p>
      <p className={`${mono ? 'font-mono' : 'font-black'} ${highlight ? 'text-2xl text-white tracking-tighter' : `text-sm ${color}`} uppercase truncate`}>
         {value}
      </p>
    </div>
  );
}

function RiskItem({ label, value, color = 'text-white' }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-slate-800/30 last:border-0 group">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">{label}</span>
      <span className={`font-mono text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

function SettingInput({ label, value, type, step, onChange, placeholder, color = "text-white", border = "focus:border-amber-500" }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <input 
        type={type} 
        defaultValue={value} 
        step={step}
        placeholder={placeholder}
        onBlur={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 ${color} font-mono text-sm ${border} outline-none transition-all shadow-inner`} 
      />
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'EXECUTED': return 'text-emerald-400';
    case 'BLOCKED': return 'text-amber-400';
    case 'FAILED': return 'text-rose-400';
    case 'DUPLICATE': return 'text-slate-500';
    default: return 'text-blue-400';
  }
}

export default App;
