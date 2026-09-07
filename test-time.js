function checkInsideTradingHours(startStr, stopStr) {
  const nowMs = Date.now();

  function parseCambodiaTimeToMs(timeStr) {
    if (!timeStr) return 0;
    if (timeStr.includes('T')) {
      return new Date(`${timeStr}+07:00`).getTime();
    } else {
      const now = new Date();
      const options = { timeZone: 'Asia/Phnom_Penh', year: 'numeric', month: '2-digit', day: '2-digit' };
      const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
      const m = parts.find(p => p.type === 'month').value;
      const d = parts.find(p => p.type === 'day').value;
      const y = parts.find(p => p.type === 'year').value;
      return new Date(`${y}-${m}-${d}T${timeStr}+07:00`).getTime();
    }
  }

  const startMs = parseCambodiaTimeToMs(startStr);
  let stopMs = parseCambodiaTimeToMs(stopStr);

  if (startMs > stopMs && !startStr.includes('T') && !stopStr.includes('T')) {
    // Overnight window daily
    stopMs += 24 * 60 * 60 * 1000;
  }

  return nowMs >= startMs && nowMs < stopMs;
}
console.log(checkInsideTradingHours("2026-08-30T08:00", "2026-08-30T15:00"));
