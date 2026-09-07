const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add lastPositionsTime
code = code.replace('let lastAccountInfoTime = 0;', 'let lastAccountInfoTime = 0;\nlet lastPositionsTime = 0;');

// 2. Remove the first `await new Promise(r => setTimeout(r, 1000));` 
code = code.replace(`            } catch (err: any) {
                // Transient network jitter is safe, keep status active
            }
            await new Promise(r => setTimeout(r, 1000));
            // 2. Account Information Sync`, `            } catch (err: any) {
                // Transient network jitter is safe, keep status active
            }
            // 2. Account Information Sync`);

// 3. Remove the second `await new Promise(r => setTimeout(r, 1000));` and wrap positions fetch
const oldPos = `            // Check Trading Session
            botState.isInsideTradingHours = checkInsideTradingHours();

            await new Promise(r => setTimeout(r, 1000));
            // Fetch Open Positions
            let positions: any[] | null = null;
            try {
                const posRes = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/positions\`, {
                    headers: { 'auth-token': token },
                    signal: AbortSignal.timeout(4000)
                });
                if (posRes.ok) {
                    positions = await posRes.json();
                }
            } catch (_) {}`;

const newPos = `            // Check Trading Session
            botState.isInsideTradingHours = checkInsideTradingHours();

            // Fetch Open Positions (every 3 seconds)
            let positions: any[] | null = null;
            if (nowTime - lastPositionsTime >= 3000) {
                lastPositionsTime = nowTime;
                try {
                    const posRes = await fetch(\`\${baseUrl}/users/current/accounts/\${accountId}/positions\`, {
                        headers: { 'auth-token': token },
                        signal: AbortSignal.timeout(4000)
                    });
                    if (posRes.ok) {
                        positions = await posRes.json();
                    }
                } catch (_) {}
            }`;

code = code.replace(oldPos, newPos);

// 4. Change interval from 10000 back to 1500
code = code.replace(`                    botState.statusMessageKhmer = '🔴 CONNECTION LOST - Custom Bridge Offline';
                }
            }
        } catch (e: any) {
            consecutivePollingFailures++;
            const lSeen = Math.max(botState.lastTickTime || 0, lastSyncTimestamp || 0);
            if (consecutivePollingFailures >= 20 && (Date.now() - lSeen > 120000)) {
                botState.account.serverConnected = false;
                botState.account.marketDataReceiving = false;
            }
        }
    }
}, 10000);`, `                    botState.statusMessageKhmer = '🔴 CONNECTION LOST - Custom Bridge Offline';
                }
            }
        } catch (e: any) {
            consecutivePollingFailures++;
            const lSeen = Math.max(botState.lastTickTime || 0, lastSyncTimestamp || 0);
            if (consecutivePollingFailures >= 20 && (Date.now() - lSeen > 120000)) {
                botState.account.serverConnected = false;
                botState.account.marketDataReceiving = false;
            }
        }
    }
}, 1500);`);

fs.writeFileSync('server.ts', code);
