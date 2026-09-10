const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target2 = `             const responseText = await res.text();
             if (!res.ok) {
                 return { success: false, error: \`HTTP \${res.status} - \${responseText}\` };
             }
             return { success: true };`;
const replacement2 = `             const responseText = await res.text();
             if (!res.ok) {
                 return { success: false, error: \`HTTP \${res.status} - \${responseText}\` };
             }
             const data = JSON.parse(responseText);
             if (data.numericCode && data.numericCode !== 10009) {
                 return { success: false, error: data.stringCode || data.message || \`MetaApi Error \${data.numericCode}\` };
             }
             return { success: true };`;

if (code.includes(target2)) {
    code = code.replace(target2, replacement2);
    fs.writeFileSync('server.ts', code);
    console.log("✅ Fixed modifyPosition in server.ts");
}
