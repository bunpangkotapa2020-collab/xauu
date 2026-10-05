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
- TradingView Webhook Signal Authority
- Signal Authentication / Fail-Closed Logic
- Risk / Position Protection Architecture
- MetaAPI / MT5 Execution Flow
- Dashboard / UI Layouts
- Approved Risk Parameters (Max Positions, Daily Limits)

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

# 🛑 STABLE CHECKPOINT — DaRa M1 Fresh Build v1.0

**Status:** The current system is LOCKED as a **STABLE CHECKPOINT**. 

## Core Architecture:
TradingView Signal → Webhook → Auth → Risk Guardian → Execution Orchestrator → Broker (Paper/Live).

## Strict "Do Not Touch" Constraints:
Under NO circumstances should the following components be modified without explicit owner request:
- ❌ Do NOT modify the Signal Authority (TradingView ONLY)
- ❌ Do NOT modify the Webhook Auth / Secret Validation
- ❌ Do NOT modify the SL/TP Realignment Logic (Actual Fill Price)
- ❌ Do NOT modify the Fail-Closed Security (Production Secret Check)
- ❌ Do NOT modify the Duplicate Signal Protection
- ❌ Do NOT modify the Risk Guardian (Daily Limits, Max Positions)
- ❌ Do NOT modify the Broker Interface
- ❌ Do NOT modify the Persistent Audit Log

---

# 🔒 FINAL STABLE CHECKPOINT — LOCK & RUN (DaRa M1 Fresh)

**Status:** The current system (DaRa M1) is officially LOCKED as a **FINAL STABLE CHECKPOINT**. 
**Goal:** RUN, OBSERVE, and RECORD.

## MAINTENANCE RULE: STABLE VERSION = LOCK ARCHITECTURE, NOT LOCK BUG FIX
The AI Agent is **AUTHORIZED** to fix technical and operational bugs (e.g., Webhook Connection, MetaApi Error, Runtime Crash, Execution Bug, Dashboard Sync Bug, Security/Safety Bug) under the following strict protocol:
1. **Root Cause First:** Identify the exact cause before writing any code.
2. **Safety First (Block Entries):** If a bug affects Real Trading, immediately BLOCK NEW ENTRIES until the system is stable.
3. **Backup First:** Preserve the stable version before making modifications.
4. **Fix ONLY the Bug:** Do not add unrequested features or change approved architecture.
5. **Verify:** Verify the fix after deployment.
6. **New Checkpoint:** Document the new Checkpoint once the fix is successful.

## DO NOT TOUCH (LOCKED TRADING PARAMETERS):
Under NO circumstances is the Agent allowed to modify any of the following:
- ❌ TradingView Signal Authority
- ❌ Auth / Fail-Closed Logic
- ❌ SL/TP Realignment Logic
- ❌ Lot Size & Risk Settings
- ❌ Order Execution Flow
- ❌ Persistent Audit Trail

# 🛡️ STRICT RULES: PRODUCTION OBSERVATION PHASE (ACTIVE NOW)
**Core Rule:** Preserve What Works. Fix Only What Breaks.

1. **NO OPTIMIZATION:** Do NOT Refactor, Rewrite, Optimize, or change any Logic unnecessarily.
2. **BUG FIXES ONLY:** IF there is an Error/Bug -> Diagnose and Fix ONLY that specific Error/Bug. IF there is NO Error -> DO NOT TOUCH ANYTHING.
3. **DO NOT TOUCH (STRICTLY FORBIDDEN):**
   - TradingView Signal Webhook
   - Auth & Secret Validation
   - Duplicate Protection
   - Risk Guardian (Limits)
   - Order Execution (Paper/Live)
   - Actual Fill SL/TP Realignment
   - MetaApi Connection
   - UI / Dashboard Logic
   - Persistent db.json state
4. **LOGGING PRIORITY:** When a Real Order happens, keep full logs intact so the user can verify: Signal Received → Auth PASS → Risk PASS → Broker Request → Actual Fill → SL/TP Realignment → Ticket Protection SUCCESS.

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

