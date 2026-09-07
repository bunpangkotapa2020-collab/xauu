const fs = require('fs');
let svr = fs.readFileSync('server.ts', 'utf8');

// Disable sendActualEntryAlert execution inside onActualEntryTriggered
svr = svr.replace(/await sendActualEntryAlert\(data\);/g, "// await sendActualEntryAlert(data); // Disabled per requested flow");

// Add sendOrderOpenedAlert
const newFunc = `
async function sendOrderOpenedAlert(data: {
    setupId: string;
    symbol: string;
    direction: 'BUY' | 'SELL';
    entry: number;
    sl: number;
    tp: number;
    lot: number;
    ticket: string;
}) {
    const formattedEntry = typeof data.entry === 'number' ? data.entry.toFixed(3) : data.entry;
    const formattedSl = typeof data.sl === 'number' ? data.sl.toFixed(3) : data.sl;
    const formattedTp = typeof data.tp === 'number' ? data.tp.toFixed(3) : data.tp;
    
    let msg = \`🟢 NEW ORDER OPENED [CONFIRMED]\\n\\n\` +
              \`Symbol: \${data.symbol || 'XAUUSDc'}\\n\` +
              \`Direction: \${data.direction}\\n\\n\` +
              \`Entry: \${formattedEntry}\\n\` +
              \`SL: \${formattedSl}\\n\` +
              \`TP: \${formattedTp}\\n\` +
              \`Lot: \${data.lot}\\n\\n\` +
              \`Ticket: \${data.ticket}\\n\` +
              \`Status: EXECUTED\`;
              
    await sendTelegramRaw(msg, \`ORDER_OPENED_\${data.ticket}\`, 0);
}

ictEaEngine.onExecutionSuccess = async (data) => {
    try {
        await sendOrderOpenedAlert(data);
    } catch (err) {
        console.error('[Telegram] Error sending Execution Success alert:', err);
    }
};
`;

svr = svr.replace(/ictEaEngine\.onExecutionFailed = async/g, newFunc + "\nictEaEngine.onExecutionFailed = async");

fs.writeFileSync('server.ts', svr);
console.log("SERVER TELEGRAM PATCH COMPLETE");
