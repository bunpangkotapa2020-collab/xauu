const fs = require('fs');

async function getState() {
  try {
    const res = await fetch('http://localhost:3000/api/bot/state');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(JSON.stringify(data.signalDetails, null, 2));
    
    // get recent logs
    const logs = data.recentLogs || [];
    const diagnosticLogs = logs.filter(log => log.message.includes('RETRACEMENT DIAGNOSTIC') || log.message.includes('INVALID OB/SETUP'));
    console.log("DIAGNOSTIC LOGS:\n" + JSON.stringify(diagnosticLogs, null, 2));

    const allAnalysisLogs = data.analysisLogs || [];
    console.log("ANALYSIS LOGS:\n" + JSON.stringify(allAnalysisLogs.slice(0, 5), null, 2));

  } catch(e) {
    console.error(e.message);
  }
}
getState();
