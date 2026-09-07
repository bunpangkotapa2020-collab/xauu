setTimeout(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/bot/telemetry');
        const data = await res.json();
        const logs = data.recentLogs || [];
        
        // Filter for diagnostic logs
        const diagnosticLogs = logs.filter(log => log.message.includes('RETRACEMENT DIAGNOSTIC') || log.message.includes('INVALID OB/SETUP'));
        
        console.log("DIAGNOSTIC LOGS:\n" + JSON.stringify(diagnosticLogs, null, 2));
    } catch(e) {
        console.error(e.message);
    }
}, 2000);
