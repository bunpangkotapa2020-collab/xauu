const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const oldAppCode = `  const handleAction = async (action: any, payload?: any) => {
    try {
      const res = await botApi.sendAction(action, payload);
      if (res?.state) {
        setBotState(res.state);
      } else {
        await fetchState();
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'ប្រតិបត្តិការបរាជ័យ' };
    }
  };`;

const newAppCode = `  const handleAction = async (action: any, payload?: any) => {
    try {
      const res = await botApi.sendAction(action, payload);
      if (res?.state) {
        setBotState(res.state);
      } else {
        await fetchState();
      }
    } catch (err: any) {
      alert(err.message || 'ប្រតិបត្តិការបរាជ័យ');
    }
  };`;
appCode = appCode.replace(oldAppCode, newAppCode);
fs.writeFileSync('src/App.tsx', appCode);

let mainCode = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');
const oldMainCode = `  const handleAction = async (action: 'start' | 'pause' | 'stop' | 'close_all') => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await onAction?.(action);
      if (res && !res.success) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };`;

const newMainCode = `  const handleAction = async (action: 'start' | 'pause' | 'stop' | 'close_all') => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await onAction?.(action);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };`;
mainCode = mainCode.replace(oldMainCode, newMainCode);
fs.writeFileSync('src/components/MainDashboard.tsx', mainCode);

console.log('UI reverted');
