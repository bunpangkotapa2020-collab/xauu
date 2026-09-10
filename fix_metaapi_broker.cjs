const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target1 = `            const data = JSON.parse(responseText);
            return { success: true, ticket: data.orderId || data.positionId || 'UNKNOWN' };`;
const replacement1 = `            const data = JSON.parse(responseText);
            if (data.numericCode && data.numericCode !== 10009) {
                return { success: false, error: data.stringCode || data.message || \`MetaApi Error \${data.numericCode}\` };
            }
            return { success: true, ticket: data.orderId || data.positionId || 'UNKNOWN' };`;

if (code.includes(target1)) {
    code = code.replace(target1, replacement1);
    fs.writeFileSync('server.ts', code);
    console.log("✅ Fixed DaRaServerBroker sendOrder numericCode check in server.ts");
} else {
    console.log("❌ Target 1 not found or already fixed.");
}
