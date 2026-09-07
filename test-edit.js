function getCambodiaDateTimeStr(timeStr) {
  if (timeStr && timeStr.includes('T')) return timeStr;

  const now = new Date();
  const options = { timeZone: 'Asia/Phnom_Penh', year: 'numeric', month: '2-digit', day: '2-digit' };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  const y = parts.find(p => p.type === 'year').value;
  
  const h = timeStr ? timeStr.split(':')[0] : '08';
  const min = timeStr ? timeStr.split(':')[1] : '00';
  
  return `${y}-${m}-${d}T${h}:${min}`;
}
console.log(getCambodiaDateTimeStr("08:00"));
