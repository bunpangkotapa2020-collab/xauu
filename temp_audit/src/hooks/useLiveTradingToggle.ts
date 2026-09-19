import { useState, useCallback, useMemo } from 'react';
import { BotState } from '../types';
import { botApi } from '../services/api';

export function useLiveTradingToggle(
  state: BotState, 
  onRefreshOrUpdate?: ((newState: BotState) => void) | (() => void)
) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalAction, setModalAction] = useState<'ENABLE' | 'DISABLE'>('ENABLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLiveEnabled = Boolean(state.riskConfig?.liveTradingEnabled);

  // Pre-condition calculations
  const isEngineRunning = (state.status === 'running' || state.desiredBotState === 'RUNNING');
  const isMt5Connected = Boolean(state.account?.serverConnected && state.account?.isConnected);

  const safety = (state as any).daraTelemetry?.safety || state.signalDetails?.daraSafety;
  const currentSpread = (state as any).spread || (state as any).spreadPoints || 0;
  const maxSpread = state.riskConfig?.maxSpreadPoints || 27;
  const isSpreadTooHigh = currentSpread > maxSpread;
  const isDailyLossHit = Boolean(
    state.dailyLossLimitHit || 
    ((state as any).dailyLoss && state.riskConfig?.maxDailyLossAmount && (state as any).dailyLoss >= state.riskConfig.maxDailyLossAmount)
  );
  const isInCooldown = Boolean(state.cooldownUntil && Date.now() < state.cooldownUntil);
  const isMaxConsecutiveSL = (state.consecutiveLosses ?? 0) >= (state.riskConfig?.maxConsecutiveLosses || 3);
  const isNewsBlocked = Boolean((state.account as any)?.newsBlockedStatus);

  let safetyBlockedReason: string | null = null;
  if (safety && !safety.isSafeToTrade && safety.blockedReason) {
    safetyBlockedReason = safety.blockedReason;
  } else if (isSpreadTooHigh) {
    safetyBlockedReason = `Spread (${currentSpread} pts) លើសពីដែនកំណត់ (${maxSpread} pts)`;
  } else if (isDailyLossHit) {
    safetyBlockedReason = `ដល់ដែនកំណត់ខាតប្រចាំថ្ងៃ (Daily Loss Limit Hit)`;
  } else if (isInCooldown) {
    safetyBlockedReason = `កំពុងសម្រាកក្រោយខាត (Cooldown Active)`;
  } else if (isMaxConsecutiveSL) {
    safetyBlockedReason = `ដល់ដែនកំណត់ខាតជាប់គ្នា (Max Consecutive SL)`;
  } else if (isNewsBlocked) {
    safetyBlockedReason = `ស្ថិតក្នុងម៉ោងព័ត៌មានសេដ្ឋកិច្ច (News Window Block)`;
  }

  const isSafetyPassed = !safetyBlockedReason;

  const preconditions = useMemo(() => ({
    isEngineRunning,
    isMt5Connected,
    isSafetyPassed,
    safetyBlockedReason,
  }), [isEngineRunning, isMt5Connected, isSafetyPassed, safetyBlockedReason]);

  // Step 1: Trigger from button click -> Always show confirmation modal
  const handleToggleClick = useCallback(() => {
    console.log('[LIVE_UI] ENABLE clicked', {
      currentState: isLiveEnabled ? 'ON' : 'OFF',
      engineRunning: isEngineRunning,
      mt5Connected: isMt5Connected,
      safetyPassed: isSafetyPassed
    });
    setErrorMessage(null);

    // If currently ON -> user wants to turn OFF
    if (isLiveEnabled) {
      console.log('[LIVE_UI] Opening DISABLE confirmation modal');
      setModalAction('DISABLE');
      setIsOpenModal(true);
      return;
    }

    // If currently OFF -> user wants to turn ON. Always open the modal so user sees status clearly!
    console.log('[LIVE_UI] Opening ENABLE confirmation modal');
    setModalAction('ENABLE');
    setIsOpenModal(true);
  }, [isLiveEnabled, isEngineRunning, isMt5Connected, isSafetyPassed]);

  // Step 2 & 3: User confirms in modal -> Validate preconditions, call backend API, verify response
  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return; // Prevent double-click
    setErrorMessage(null);

    const targetLiveState = modalAction === 'ENABLE';
    console.log('[LIVE_UI] confirmation accepted', { targetLiveState });

    // Enforce pre-conditions if user is turning ON Live Trading
    if (targetLiveState) {
      if (!isEngineRunning) {
        const msg = '❌ បដិសេធ (DENIED): DaRa Engine មិនទាន់ RUNNING នៅឡើយទេ។ សូមចុចប៊ូតុង «START BOT» ជាមុនសិន។';
        console.warn('[LIVE_UI] Pre-condition check failed: Engine is not running');
        setErrorMessage(msg);
        return;
      }

      if (!isMt5Connected) {
        const msg = '❌ បដិសេធ (DENIED): គណនី MT5 មិនទាន់ CONNECTED នៅឡើយទេ។ សូមរង់ចាំការភ្ជាប់ទៅកាន់ MT5 Server ជាមុនសិន។';
        console.warn('[LIVE_UI] Pre-condition check failed: MT5 is disconnected');
        setErrorMessage(msg);
        return;
      }

      if (!isSafetyPassed) {
        const msg = `❌ បដិសេធ (DENIED): ប្រព័ន្ធសុវត្ថិភាព (Safety Guard) កំពុងរាំង៖ ${safetyBlockedReason || 'Safety Blocked'}។ មិនអាចបើក Live Trading បានទេ។`;
        console.warn('[LIVE_UI] Pre-condition check failed: Safety guards blocked', safetyBlockedReason);
        setErrorMessage(msg);
        return;
      }
    }

    setIsSubmitting(true);
    console.log('[LIVE_UI] calling updateRiskConfig', { liveTradingEnabled: targetLiveState });

    try {
      const result = await botApi.updateRiskConfig({ liveTradingEnabled: targetLiveState });
      console.log('[LIVE_UI] API response:', result);

      if (!result || !result.success) {
        throw new Error(result?.message || result?.error || 'បរាជ័យក្នុងការផ្លាស់ប្តូរស្ថានភាព Live Trading');
      }

      // Step 5: Verify backend state
      const confirmedState = result.confirmedLiveTrading !== undefined 
        ? result.confirmedLiveTrading 
        : result.state?.riskConfig?.liveTradingEnabled;

      if (confirmedState !== targetLiveState) {
        throw new Error(`Server returned confirmed state (${confirmedState}) which does not match requested state (${targetLiveState})`);
      }

      console.log('[LIVE_UI] State confirmed by backend:', { confirmedState });

      // Step 6: Success: notify listeners and update state
      if (typeof onRefreshOrUpdate === 'function') {
        if (result.state) {
          (onRefreshOrUpdate as any)(result.state);
        } else {
          (onRefreshOrUpdate as any)();
        }
      }
      window.dispatchEvent(new Event('refresh_state'));

      setIsOpenModal(false);
    } catch (err: any) {
      const errorText = err?.message || 'មានបញ្ហាបច្ចេកទេសក្នុងការតភ្ជាប់ទៅកាន់ Server';
      console.error('[LIVE_UI] API error / failure:', err);
      setErrorMessage(errorText);
      // If anything fails: remain OFF / current state, show error message, do NOT pretend LIVE is ON.
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, modalAction, isEngineRunning, isMt5Connected, isSafetyPassed, safetyBlockedReason, onRefreshOrUpdate]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setIsOpenModal(false);
    setErrorMessage(null);
  }, [isSubmitting]);

  return {
    isLiveEnabled,
    isSubmitting,
    isOpenModal,
    modalAction,
    errorMessage,
    preconditions,
    handleToggleClick,
    handleConfirm,
    handleClose,
  };
}
