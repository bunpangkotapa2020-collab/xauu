import React, { useState } from 'react';
import { Play, Pause, Square, XCircle, AlertOctagon, Clock, RefreshCw, UserPlus, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { BotState } from '../types';

interface InteractiveTestPanelProps {
  botState: BotState;
  onAction: (action: any, payload?: any) => Promise<void>;
  onSimulateTest: (testType: any) => Promise<void>;
}

export const InteractiveTestPanel: React.FC<InteractiveTestPanelProps> = ({
  botState,
  onAction,
  onSimulateTest,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runTest = async (title: string, fn: () => Promise<void>) => {
    try {
      setTestResult(`⏳ កំពុងដំណើរការតេស្ត: ${title}...`);
      await fn();
      setTestResult(`✅ តេស្តបានជោគជ័យ: ${title}`);
    } catch (e: any) {
      setTestResult(`❌ បរាជ័យ: ${e.message}`);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <button
        id="toggle-test-panel-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-300 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>🧪 ផ្ទាំងតេស្តសាកល្បងលក្ខខណ្ឌ Bot គ្រប់ Flow (Interactive Testing Suite)</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <span>{isOpen ? 'បង្រួម' : 'បើកមើល'}</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          <p className="text-xs text-slate-400">
            ចុចប៊ូតុងខាងក្រោមដើម្បីតេស្តលក្ខខណ្ឌប្រតិបត្តិការនីមួយៗតាមការកំណត់ក្នុង Requirement 13៖
          </p>

          {testResult && (
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs font-mono">
              {testResult}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {/* Test 1: START */}
            <button
              id="test-start-btn"
              onClick={() => runTest('Test START (ចាប់ផ្តើម)', () => onAction('start'))}
              className="p-2.5 bg-slate-950/70 hover:bg-slate-950 border border-emerald-500/20 hover:border-emerald-500/50 rounded-xl text-left text-xs transition-all"
            >
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                <Play size={13} />
                <span>1. Test START</span>
              </div>
              <p className="text-[11px] text-slate-400">Bot វិភាគ & បើក Trade មាសស្វ័យប្រវត្តិ</p>
            </button>

            {/* Test 2: PAUSE */}
            <button
              id="test-pause-btn"
              onClick={() => runTest('Test PAUSE (ផ្អាក)', () => onAction('pause'))}
              className="p-2.5 bg-slate-950/70 hover:bg-slate-950 border border-amber-500/20 hover:border-amber-500/50 rounded-xl text-left text-xs transition-all"
            >
              <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                <Pause size={13} />
                <span>2. Test PAUSE</span>
              </div>
              <p className="text-[11px] text-slate-400">ផ្អាកការបើក Trade ថ្មីភ្លាមៗ</p>
            </button>

            {/* Test 3: STOP */}
            <button
              id="test-stop-btn"
              onClick={() => runTest('Test STOP (បញ្ឈប់)', () => onAction('stop'))}
              className="p-2.5 bg-slate-950/70 hover:bg-slate-950 border border-rose-500/20 hover:border-rose-500/50 rounded-xl text-left text-xs transition-all"
            >
              <div className="font-semibold text-rose-400 flex items-center gap-1.5 mb-1">
                <Square size={13} />
                <span>3. Test STOP</span>
              </div>
              <p className="text-[11px] text-slate-400">បញ្ឈប់ Bot មិនឱ្យបើក Trade ទៀត</p>
            </button>

            {/* Test 4: Add Manual Trade & Test CLOSE ALL (Magic Number Isolation) */}
            <button
              id="test-magic-isolation-btn"
              onClick={async () => {
                await runTest('បង្កើត Manual Trade (Magic: 0)', () => onSimulateTest('add_manual_trade'));
              }}
              className="p-2.5 bg-slate-950/70 hover:bg-slate-950 border border-indigo-500/20 hover:border-indigo-500/50 rounded-xl text-left text-xs transition-all"
            >
              <div className="font-semibold text-indigo-400 flex items-center gap-1.5 mb-1">
                <UserPlus size={13} />
                <span>4. បង្កើត Manual Trade</span>
              </div>
              <p className="text-[11px] text-slate-400">ដើម្បីតេស្តថា CLOSE ALL មិនប៉ះពាល់</p>
            </button>

            {/* Test 5: Trigger Daily Loss Limit Hit */}
            <button
              id="test-daily-loss-btn"
              onClick={() => runTest('Test Daily Loss Limit Hit', () => onSimulateTest('trigger_daily_loss'))}
              className="p-2.5 bg-slate-950/70 hover:bg-slate-950 border border-red-500/30 hover:border-red-500 rounded-xl text-left text-xs transition-all"
            >
              <div className="font-semibold text-red-400 flex items-center gap-1.5 mb-1">
                <AlertOctagon size={13} />
                <span>5. Test Daily Loss Hit</span>
              </div>
              <p className="text-[11px] text-slate-400">Status នឹងបង្ហាញ "🛑 ដល់កម្រិតខាត"</p>
            </button>

            {/* Test 6: Toggle Trading Hours (Inside / Outside) */}
            <button
              id="test-trading-hours-btn"
              onClick={() => {
                const isCurrentlyEnabled = botState.tradingHours.enabled;
                const newStart = botState.isInsideTradingHours ? '23:00' : '00:00';
                const newStop = botState.isInsideTradingHours ? '23:59' : '23:59';
                runTest('Test Trading Hours Filter', () =>
                  onAction('update_trading_hours', {
                    startHour: newStart,
                    stopHour: newStop,
                    enabled: true,
                  })
                );
              }}
              className="p-2.5 bg-slate-950/70 hover:bg-slate-950 border border-blue-500/20 hover:border-blue-500/50 rounded-xl text-left text-xs transition-all"
            >
              <div className="font-semibold text-blue-400 flex items-center gap-1.5 mb-1">
                <Clock size={13} />
                <span>6. Test ម៉ោងជួញដូរ</span>
              </div>
              <p className="text-[11px] text-slate-400">ប្តូរម៉ោងទៅក្រៅ Trading Hours</p>
            </button>
          </div>

          {botState.dailyLossLimitHit && (
            <div className="pt-2">
              <button
                id="reset-daily-limit-btn"
                onClick={() => onAction('reset_daily_limit')}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} />
                <span>កំណត់ Daily Loss ឡើងវិញ (Reset Daily Loss) ដើម្បីបន្តតេស្ត</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
