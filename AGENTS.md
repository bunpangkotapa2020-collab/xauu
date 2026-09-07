# 👑 PROJECT OWNER DIRECTIVE & MASTER CONTINUITY PROTOCOL

**Project Owner:** The User is the SOLE OWNER and FINAL AUTHORITY of this project.
**Core Operating Law:**
1. **Never Start from Scratch:** Always use and build upon existing history, code, configurations, and decisions established with the Owner.
2. **Preserve What Works:** All completed features, fixes, and stable states must be strictly preserved. NEVER modify or refactor existing working code on your own.
3. **Owner-Requested Changes Only:** Modify or add ONLY what the Owner explicitly requests, or fix clearly documented errors. Never make speculative changes.
4. **Context First:** Always review existing project files, state, and history before answering or taking any action. Never guess.
5. **Absolute Respect for Owner's Authority:** Strictly adhere to the Owner's instructions and maintain the integrity of all completed work.

---

# 🔒 STABLE VERSION + SAFE MAINTENANCE POLICY

**Status:** The current codebase is officially designated as the **STABLE/MASTER VERSION**.

## 1. Maintenance & Bug Fixes (PRE-APPROVED)
The AI Agent is **AUTHORIZED** to immediately fix the following issues without waiting for user approval:
- System Errors & Runtime Errors
- Application Crashes
- Server, API, or Connection Errors
- Bugs that break existing features
- Security or Authentication Errors
- Technical Issues required to keep the system running

**Core Maintenance Rule:** Fix the Problem ➔ Preserve Existing Logic ➔ Do Not Change Approved Setup.

## 2. STRICTLY FORBIDDEN (Requires Explicit User Approval)
The Agent MUST NOT alter any of the following silently or speculatively. If changes are needed here, the Agent must notify the user and ask for approval first:
- SMC Model (H4 → M15 → M1)
- Sequence 4 Entries logic
- Risk % and Auto Lot calculations
- Stop Loss (SL) / Take Profit (TP) structures
- Trailing SL / Profit Protection logic
- Daily Loss Protection thresholds
- Market Awareness logic
- MT5 Connection Logic
- Telegram Alert Logic
- Dashboard / UI Layouts
- Approved Trading Parameters

## 3. Post-Fix Reporting Protocol
Whenever a bug or error is fixed, the Agent MUST provide a detailed report to the user in this exact format:
- **Error:** What was the error?
- **Cause:** Why did it happen?
- **Fix:** What was changed?
- **Affected Areas:** Which parts of the code were modified?
- **Logic Integrity:** Confirmation that core trading logic remains intact.
- **Testing:** Was it tested post-fix?
- **Backup Status:** Is the previous stable state preserved?

---

# 🛑 STABLE CHECKPOINT & ICT STRATEGY PREPARATION

**Status:** The current system is LOCKED as a **STABLE CHECKPOINT**. No further modifications to the current system are allowed.

## Strict "Do Not Touch" Constraints:
Under NO circumstances should the following components be modified for the new ICT EA build:
- ❌ Do NOT modify the Dashboard
- ❌ Do NOT modify Templates
- ❌ Do NOT modify the UI
- ❌ Do NOT modify the Server
- ❌ Do NOT modify MT5 Connection Logic
- ❌ Do NOT modify APIs or API Keys
- ❌ Do NOT modify the VPS setup
- ❌ Do NOT modify existing Settings
- ❌ Do NOT modify any currently running Functions

## EA Development Rules (ICT Strategy):
1. **Wait for Specification:** The Agent MUST NOT code any new trading logic until the user provides the **"MASTER ICT EA SPECIFICATION"**.
2. **Independent Build:** The new ICT EA will be created entirely separate from the old EA.
3. **Backup Old EA:** The old SMC EA must be retained as a backup.
4. **Swap Only When Ready:** The new ICT EA will only be connected to replace the old EA once the strategy is fully completed and approved by the user.

---

# 📈 MASTER ICT EA SPECIFICATION (INITIAL DRAFT)

**Symbol:** XAUUSD ONLY
**Account:** REAL USC (Cent Account) ONLY

## 1. Account & Balance
- EA MUST use a Real MT5 USC (Cent Account).
- EA MUST retrieve and use the real Balance/Equity directly from MT5.
- NEVER use fake, hardcoded, or demo balances on the Dashboard.

## 2. Lot Size Management
- Lot Size is strictly **USER-DEFINED**.
- If the user sets `0.01`, every entry MUST use exactly `0.01`.
- EA MUST NOT auto-scale the Lot Size based on Balance or Risk %.
- EA MUST verify Requested Lot vs. Executed Lot from MT5.

## 3. Daily Loss Limit
- Daily Loss Limit is strictly **USER-DEFINED**.
- EA MUST respect this limit. If the limit is reached, the EA MUST STOP opening new trades for the day.

## 4. Stop Loss (SL)
- SL is **DYNAMIC**, determined by ICT Structure/Invalidation Levels. DO NOT use a fixed 30-pip SL.
- **BUY:** SL below the Invalidating Swing Low + appropriate buffer.
- **SELL:** SL above the Invalidating Swing High + appropriate buffer.
- SL must be reasonably sized to avoid being stopped out by standard XAUUSD market noise.
- EA MUST have a **Maximum SL Protection** limit to prevent catastrophic risk exposure.

## 5. Take Profit (TP)
- TP is **DYNAMIC**, automatically determined by the EA targeting ICT Liquidity.
- **BUY:** Target upside liquidity.
- **SELL:** Target downside liquidity.
- EA MUST verify a Minimum Risk:Reward (R:R) ratio before entering any trade.

## 6. Responsibilities Breakdown
**User Defines:**
- Lot Size
- Daily Loss Limit
- Trading Time
- Max Open Trades

**EA Automates:**
- Entry (based on strict ICT analysis)
- Stop Loss (dynamic, structure-based)
- Take Profit (dynamic, liquidity-based)

*Note: The EA MUST perform full ICT analysis before entering a trade. It MUST NOT execute trades immediately upon clicking "START".*

---

# 🔒 FINAL STABLE CHECKPOINT — LOCK & RUN (ICT EA)

**Status:** The current system (ICT EA) is officially LOCKED as a **FINAL STABLE CHECKPOINT**. 
**Goal:** RUN, OBSERVE, and RECORD.

## MAINTENANCE RULE: STABLE VERSION = LOCK STRATEGY, NOT LOCK BUG FIX
The AI Agent is **AUTHORIZED** to fix technical and operational bugs (e.g., Connection Error, MT5/EA Disconnect, MetaApi Error, Market Feed Error, Runtime Crash, Execution Bug, Dashboard Sync Bug, Security/Safety Bug) under the following strict protocol:
1. **Root Cause First:** Identify the exact cause before writing any code.
2. **Safety First (Block Entries):** If a bug affects Real Trading, immediately BLOCK NEW ENTRIES until the system is stable.
3. **Backup First:** Preserve the stable version before making modifications.
4. **Fix ONLY the Bug:** Do not add unrequested features or change existing logic just to make it "different".
5. **Verify:** Verify the fix after deployment.
6. **New Checkpoint:** Document the new Checkpoint once the fix is successful.

## DO NOT TOUCH (LOCKED STRATEGY PARAMETERS):
Under NO circumstances is the Agent allowed to modify any of the following:
- ❌ ICT Strategy Logic (H4, M15, M1 sequence)
- ❌ Entry Logic (OB / FVG / Retracement validation)
- ❌ SL/TP logic and calculation
- ❌ Lot Size
- ❌ Risk Settings
- ❌ Reset Account or open Test Trades on a Real Account

# 🛡️ STRICT RULES: POST-DEPLOYMENT OBSERVATION PHASE (ACTIVE NOW)
**Core Rule:** Preserve What Works. Fix Only What Breaks.

1. **NO OPTIMIZATION:** Do NOT Refactor, Rewrite, Optimize, or change any Logic unnecessarily.
2. **BUG FIXES ONLY:** IF there is an Error/Bug -> Diagnose and Fix ONLY that specific Error/Bug. IF there is NO Error -> DO NOT TOUCH ANYTHING.
3. **DO NOT TOUCH (STRICTLY FORBIDDEN):**
   - ICT H4 → M15 → M1
   - Liquidity / Sweep / Displacement
   - OB / FVG
   - 3-0 + 5-FVG
   - Entry Logic
   - Retracement
   - User Settings
   - Latest Settings JIT Sync
   - Lot / SL / TP
   - Safety Check
   - Live MT5 Feed
   - Symbol Logic
   - MetaApi Execution
   - UI Flow
4. **LOGGING PRIORITY:** When a Real Order happens, keep full logs intact so the user can verify: ICT Setup → Entry → Latest Settings → Safety Check → MetaApi Request → MT5 Result → Ticket → Position → SL/TP.

---

# 🚀 VPS CODE SYNCHRONIZATION & DEPLOYMENT MANDATE

**Status:** ACTIVE MANDATORY RULE FOR ALL CODE CHANGES.

## 1. Absolute Rule: Never Keep Code Local Only
Every time there is ANY modification to Code / Function / Logic / UI / Settings / Bug Fix / Feature / Calculation / Configuration that requires code editing, the AI Agent MUST prepare and provide the updated code for deployment on the **External VPS**.

## 2. Mandatory End-to-End Workflow:
1. **USER REQUEST**
2. **MODIFY CODE**
3. **BUILD / COMPILE** (`compile_applet` / `lint_applet`)
4. **TEST / VERIFY** (Execute test suites / verify logic)
5. **PREPARE UPDATED CODE** (Identify exact modified files and provide copy-paste ready code or patch instructions)
6. **PROVIDE CODE FOR VPS UPDATE**
7. **VPS DEPLOYMENT INSTRUCTIONS** (Commands to copy/deploy and restart services if needed)
8. **VERIFY RUNTIME VERSION**

## 3. Mandatory Reporting Requirements for Every Code Change:
Every response involving code changes MUST include:
- **Modified File Names:** Exact list of modified files.
- **Code Version / Checkpoint ID:** Specific identifier for tracking.
- **Build / Compile Result:** Verification that `tsc` / `npm run build` passed cleanly.
- **Test Result:** Output confirming verification test results.
- **Deployment / Update Instructions for VPS:** Clear step-by-step commands (e.g. `pm2 restart`, file placement).
- **Confirmation Statement:** Explicit confirmation that this version is ready to run on VPS.
- **Mandatory Closing Tag:** Must end with:
  `UPDATED CODE READY FOR VPS`

