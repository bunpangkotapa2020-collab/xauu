const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `             const data = JSON.parse(responseText);
             if (data.numericCode && data.numericCode !== 10009) {
                 return { success: false, error: data.stringCode || data.message || \`MetaApi Error \${data.numericCode}\` };
             }
             return { success: true };`;

const replacement1 = `             const data = JSON.parse(responseText);
             if (data.numericCode && data.numericCode !== 10009) {
                 console.error('[DaRa Broker Modify] ❌ MetaApi Error:', data.stringCode || data.message);
                 return { success: false, error: data.stringCode || data.message || \`MetaApi Error \${data.numericCode}\` };
             }
             console.log('[DaRa Broker Modify] ✅ Success for ticket', ticket, 'newSl:', newSl, 'newTp:', newTp);
             return { success: true };`;

code = code.replace(target1, replacement1);
fs.writeFileSync('server.ts', code);
