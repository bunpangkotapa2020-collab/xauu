const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCheck = `            // 2. Account Information Sync (every 5 seconds or if balance missing)
            if (nowTime - lastAccountInfoTime >= 5000 || botState.account.balance === 0) {`;

const newCheck = `            await new Promise(r => setTimeout(r, 1000));
            // 2. Account Information Sync (every 5 seconds or if balance missing)
            if (nowTime - lastAccountInfoTime >= 5000 || botState.account.balance === 0) {`;

code = code.replace(oldCheck, newCheck);

const oldPos = `            // Fetch Open Positions
            let positions: any[] | null = null;
            try {
                const posRes = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/positions\``;

const newPos = `            await new Promise(r => setTimeout(r, 1000));
            // Fetch Open Positions
            let positions: any[] | null = null;
            try {
                const posRes = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/positions\``;

code = code.replace(oldPos, newPos);

fs.writeFileSync('server.ts', code);
