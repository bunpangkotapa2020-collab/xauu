const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// 1. Remove imports
code = code.replace(/import \{ IctXauusdEA, EAConfig \} from '\.\/src\/MASTER_ICT_EA\.js';\n?/, '');
code = code.replace(/import \{ ICTRealMarketAdapter \} from '\.\/src\/ICT_RealMarketAdapter\.js';\n?/, '');
code = code.replace(/import \{ RealNewsProvider \} from '\.\/src\/ICT_NewsAdapter\.js';\n?/, '');

// 2. Remove instances
code = code.replace(/const ictNewsProvider = new RealNewsProvider\(\);\n?/, '');
code = code.replace(/const ictEaEngine = new IctXauusdEA\(ictEaConfig, ictNewsProvider, new RealMetaApiExecution\(\)\);\n?/, '');
code = code.replace(/const ictMarketAdapter = new ICTRealMarketAdapter\(ictEaEngine\);\n?/, '');
code = code.replace(/ictEaEngine\.start\(\);\n?/, '');

// 3. Remove ictMarketAdapter tick forward
code = code.replace(/\/\/ Forward live tick to ICT Market Adapter \(legacy bridge continuity\)\s*if \(ictMarketAdapter && typeof \(ictMarketAdapter as any\)\.onTick === 'function'\) \{\s*try \{\s*\(ictMarketAdapter as any\)\.onTick\(primarySymbol, bid, ask, Date\.now\(\)\);\s*\} catch \(e\) \{\s*console\.error\('\[ICT EA\] Error forwarding tick:', e\);\s*\}\s*\}/g, '');

// 4. Remove executeAIAnalysis and its interval
code = code.replace(/let isExecutingAIAnalysis = false;\n?/, '');
code = code.replace(/async function executeAIAnalysis\(\) \{[\s\S]*?\/\/ DEDICATED 1-MINUTE AI ANALYSIS TIMER\n?setInterval\(async \(\) => \{[\s\S]*?\}, AI_ANALYSIS_INTERVAL_MS\);\n?/g, '');

// 5. Remove ictNewsProvider.getStatus block
code = code.replace(/if \(ictNewsProvider && typeof ictNewsProvider\.getStatus === 'function'\) \{\s*botState\.newsProviderStatus = ictNewsProvider\.getStatus\(\);\s*\}/g, '');

// 6. Remove ictEaEngine.getTelemetry block
code = code.replace(/if \(ictEaEngine && typeof ictEaEngine\.getTelemetry === 'function'\) \{\s*botState\.ictAnalysis = ictEaEngine\.getTelemetry\(botState\);\s*\}/g, '');

// 7. Replace botState assignments that reference ictEaEngine
// Example: currentSetupStage: ictEaEngine.state.currentSetup?.stage || 'SEARCHING'
// We will just remove the whole ictEaEngine references from /api/state
// Wait, I should do a safe replace of the exact lines in /api/state:
code = code.replace(/...ictEaEngine\.config,\s*/, '');
code = code.replace(/LIVE_TRADING_ENABLED: ictEaEngine\.LIVE_TRADING_ENABLED,\s*/, '');
code = code.replace(/currentSetupStage: ictEaEngine\.state\.currentSetup\?\.stage \|\| 'SEARCHING',\s*/, '');
code = code.replace(/currentSetupId: ictEaEngine\.state\.currentSetup\?\.id \|\| null,\s*/, '');
code = code.replace(/entryZone: ictEaEngine\.state\.currentSetup \? `\[\$\{ictEaEngine\.state\.currentSetup\.obLow\?\.toFixed\(3\)\} - \$\{ictEaEngine\.state\.currentSetup\.obHigh\?\.toFixed\(3\)\}\]` : null,\s*/, '');
code = code.replace(/actualEntryPrice: ictEaEngine\.state\.currentSetup\?\.lockedEntryPrice \|\| \(ictEaEngine\.state\.currentSetup \? \(ictEaEngine\.state\.currentSetup\.bias === 'BULLISH' \? ictEaEngine\.state\.currentSetup\.obHigh : ictEaEngine\.state\.currentSetup\.obLow\) : null\),\s*/, '');
code = code.replace(/triggerStatus: ictEaEngine\.state\.currentSetup\?\.stage === 'TRIGGERED' \? 'ENTRY TRIGGERED' : \(ictEaEngine\.state\.currentSetup \? 'WAITING' : 'SEARCHING'\)/, '');

// 8. Callbacks
code = code.replace(/ictEaEngine\.onSetupConfirmed = async \(data\) => \{[\s\S]*?\};\n?/g, '');
code = code.replace(/ictEaEngine\.onActualEntryTriggered = async \(data\) => \{[\s\S]*?\};\n?/g, '');
code = code.replace(/ictEaEngine\.onExecutionSuccess = async \(data\) => \{[\s\S]*?\};\n?/g, '');
code = code.replace(/ictEaEngine\.onExecutionFailed = async \(data\) => \{[\s\S]*?\};\n?/g, '');

// 9. Other random lines
code = code.replace(/ictEaEngine\.LIVE_TRADING_ENABLED = (false|true);\s*/g, '');
code = code.replace(/ictEaEngine\.liveTradingBlockReason = ".*?";\s*/g, '');
code = code.replace(/if \(ictEaEngine\?\.tradeProfitLockState\) \{\s*ictEaEngine\.tradeProfitLockState\.delete\(String\(oldTrade\.id\)\);\s*\}/g, '');
code = code.replace(/if \(!ictEaEngine\.state\.currentSetup \|\| ictEaEngine\.state\.currentSetup\.stage === 'INVALIDATED'\) \{ botState\.signals = \{ gold: 'WAIT' \}; \}/g, '');
code = code.replace(/if \(ictEaEngine && ictEaEngine\.state\) \{\s*ictEaEngine\.state\.currentSetup = null;\s*\}/g, '');

// Clean up any remaining ictEaEngine blocks in settings sync
code = code.replace(/if \(typeof ictEaEngine !== 'undefined' && ictEaEngine\.config\) \{[\s\S]*?\}\n?/g, '');

// Remove executeAIAnalysis() calls
code = code.replace(/await executeAIAnalysis\(\);\s*/g, '');
code = code.replace(/executeAIAnalysis\(\)\.then\(\(\) => \{\}\)\.catch\(\(\) => \{\}\);\s*/g, '');
code = code.replace(/executeAIAnalysis\(\)\.catch\(console\.error\);\s*/g, '');
code = code.replace(/executeAIAnalysis\(\)\.then\(\(\) => \{\s*\}\)\.catch\(console\.error\);\s*/g, '');

fs.writeFileSync('server.ts', code);
console.log("Replacements executed.");
