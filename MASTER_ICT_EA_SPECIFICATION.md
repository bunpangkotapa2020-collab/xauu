DEVELOPER — FINAL MASTER REQUIREMENT
NEW ICT XAUUSD EA
====================================

IMPORTANT:
Do NOT redesign or modify the existing application.

The existing UI, Dashboard, Template, API, API Keys,
Server infrastructure, MT5 connection, settings system,
branding, icons, and all currently working features MUST
remain unchanged.

The ONLY major replacement is:

OLD EA TRADING LOGIC
        ↓
NEW ICT XAUUSD EA LOGIC


1. SYMBOL & ACCOUNT
-------------------
Symbol:
XAUUSD ONLY

Do NOT add BTC or other symbols.

Account:
REAL MT5 USC / CENT ACCOUNT

Balance and Equity must be read directly from the real MT5
account. Never use fake/demo balance values in the Dashboard.


2. TIMEFRAME ARCHITECTURE
-------------------------
Main flow:

H4 → M15 → M1

H4:
Determine the primary market bias:
BULLISH or BEARISH.

M15:
Analyze ICT context and liquidity.

M1:
Perform precise entry confirmation and entry timing.


3. ICT ANALYSIS
---------------
M15 analysis should evaluate:

- Liquidity
- Stop Hunt / Liquidity Sweep
- CISD
- IDM
- Breaker
- PD Array
- Relevant ICT structure

M1 should evaluate:

- Market structure
- Displacement
- Order Block
- FVG
- Retracement
- Entry confirmation


4. BUY LOGIC
------------
Example sequence:

H4 = BULLISH
↓
M15 liquidity identified
↓
Sell-side liquidity sweep / Stop Hunt
↓
Bullish CISD / displacement confirmation
↓
ICT context valid
↓
M1 bullish confirmation
↓
Valid Bullish OB / FVG
↓
Price retracement
↓
Risk validation
↓
BUY XAUUSD


5. SELL LOGIC
-------------
Example sequence:

H4 = BEARISH
↓
M15 liquidity identified
↓
Buy-side liquidity sweep / Stop Hunt
↓
Bearish CISD / displacement confirmation
↓
ICT context valid
↓
M1 bearish confirmation
↓
Valid Bearish OB / FVG
↓
Price retracement
↓
Risk validation
↓
SELL XAUUSD


6. START BEHAVIOR
-----------------
START must NOT immediately open a trade.

START means:

START
↓
Begin analysis
↓
H4
↓
M15
↓
M1
↓
Wait for a complete valid ICT setup
↓
Risk checks
↓
Entry only if ALL required conditions pass

If no valid setup exists:
WAIT and continue analyzing.

START ≠ immediate BUY/SELL.


7. ANALYSIS FREQUENCY
---------------------
The EA should continuously monitor the market with an
approximately 1-minute analysis cycle while START is active.

Important:

1-minute analysis does NOT mean forced trading every minute.

Trading only occurs when a NEW valid ICT setup is confirmed.


8. FOUR SEPARATE ENTRIES
------------------------
User setting:

Max Open Trades = 4

If Lot Size = 0.01:

Position #1 → 0.01
Position #2 → 0.01
Position #3 → 0.01
Position #4 → 0.01

Each position MUST have its own independent setup.

RULE:

1 SETUP = 1 ENTRY

Do NOT open four positions from one signal.

After each entry, return to fresh analysis.

If one position closes:

4 open
↓
3 open
↓
available slot = 1
↓
fresh ICT analysis
↓
new valid setup
↓
new 0.01 entry

Continue this process while START is active and trading
conditions allow it.


9. LOT SIZE
-----------
Lot Size is USER CONTROLLED.

If user sets:

0.01

the EA must request/use:

0.01

Do NOT automatically convert 0.01 into 0.17, 0.18,
or another lot size.

Do NOT automatically scale the fixed lot according
to account balance.

Before execution:

Requested Lot
↓
Validate against MT5 symbol specifications
(Min Lot / Max Lot / Lot Step)
↓
Execute
↓
Read actual executed lot
↓
Verify requested vs executed


10. SL — STOP LOSS
------------------
SL is EA controlled.

The EA determines SL using ICT market structure /
invalidation logic.

BUY:
SL should be based on the relevant invalidation/swing low
plus an appropriate structural buffer.

SELL:
SL should be based on the relevant invalidation/swing high
plus an appropriate structural buffer.

IMPORTANT:

Minimum SL Distance = 10.00 XAUUSD PRICE UNITS

This does NOT mean:
10 USC
10 USD risk
10%
10 lots

It means a minimum price distance of 10.00 on XAUUSD.

If the structural SL is farther than 10.00,
the EA may use the larger valid structural distance,
provided risk protection allows it.

If the calculated structural SL is less than 10.00:    do NOT simply force an unsafe entry.
Recalculate or reject the setup according to the rules.


11. TP — TAKE PROFIT
--------------------
TP is EA controlled.

TP should be based on ICT liquidity targets.

Possible targets include relevant:

- Previous High / Low
- Swing High / Low
- Equal High / Equal Low
- Buy-side Liquidity
- Sell-side Liquidity
- Major liquidity targets

Minimum TP Distance:

10.00 XAUUSD PRICE UNITS

TP must also pass the configured minimum R:R requirement.

If no valid liquidity target provides acceptable R:R:
NO TRADE.


12. USER CONTROLLED RISK SETTINGS
---------------------------------
The following are controlled by the USER:

- Lot Size
- Daily Loss Limit
- Maximum Consecutive SL
- Cooldown
- Maximum Open Trades
- Trading Hours

The EA must execute these settings exactly.

Do NOT silently modify these values.


13. DAILY LOSS LIMIT
--------------------
Daily Loss Limit is USER CONTROLLED.

When the real MT5 account reaches the configured daily
loss limit:

BLOCK NEW ENTRIES.

Existing positions should continue according to their
normal SL/TP/management rules unless the user explicitly
configures a different behavior.

Daily calculation must use real MT5 account data.


14. CONSECUTIVE SL
------------------
Maximum Consecutive SL is USER CONTROLLED.

Example:

Max Consecutive SL = 3

SL #1 → cooldown / continue according to settings
SL #2 → cooldown / continue
SL #3 → BLOCK NEW ENTRIES

A profitable completed trade should reset the consecutive
loss counter according to the configured rule.


15. COOLDOWN
------------
Cooldown is USER CONTROLLED.

Example:

Cooldown = 15 minutes

After a qualifying loss/SL:

COOLDOWN ACTIVE
↓
NO NEW ENTRY
↓
Cooldown expires
↓
FRESH ICT ANALYSIS
↓
Valid setup?
↓
Entry only if all conditions pass


16. TRADING HOURS
-----------------
Trading Start Time and Trading End Time are USER CONTROLLED.

Inside the configured session:
EA may analyze and enter if conditions are valid.

Outside the session:
NO NEW ENTRY.

Existing positions must NOT be automatically closed merely
because the trading session ended, unless explicitly configured.

Use MT5 Broker Server Time as the authoritative trading
time reference.


17. AUTO RE-ANALYSIS
--------------------
After a trade closes:

TRADE CLOSED
↓
Update P/L and risk state
↓
Check limits
↓
Fresh ICT analysis
↓
New setup
↓
New entry if valid

The user does NOT need to press START again after every trade.

If START remains active, the EA continues automatically.


18. SETUP LIFECYCLE
-------------------
Each setup must have a clear lifecycle:

NEW
↓
ANALYZING
↓
WAITING
↓
CONFIRMED
↓
READY
↓
EXECUTING
↓
ENTRY

A setup becomes INVALID if required conditions are
broken, structure is invalidated, bias changes, or the
setup expires.

Invalid setup:
CANCEL
↓
FRESH ANALYSIS

Never reuse stale setups.


19. CANDLE PROCESSING
---------------------
H4 and M15 structural confirmations should use appropriate
closed-candle confirmation where required.

M1 is used for entry timing.

The EA must prevent the same candle/signal from producing
duplicate entries.

RULE:

1 SIGNAL = 1 ORDER

Do not repeatedly enter because the same signal is detected
multiple times.


20. MT5 EXECUTION SAFETY
------------------------
Before every order:

1. Verify live market data
2. Verify MT5 connection
3. Synchronize account
4. Verify XAUUSD availability
5. Verify ICT setup
6. Verify trading session
7. Verify daily loss
8. Verify consecutive SL limit
9. Verify cooldown
10. Verify available trade slot
11. Verify duplicate protection
12. Validate lot
13. Validate spread
14. Calculate/validate SL
15. Calculate/validate TP
16. Validate R:R
17. Send order
18. Wait for MT5 confirmation
19. Read actual executed position
20. Reconcile EA state with real MT5 state


21. EXECUTION MISMATCH PROTECTION
---------------------------------
Example:

Requested:
BUY XAUUSD
LOT 0.01

MT5:
BUY XAUUSD
LOT 0.01

→ PASS

If actual execution does not match the expected
parameters:

→ FLAG EXECUTION MISMATCH
→ LOG THE DETAILS
→ DO NOT falsely report SUCCESS. → Reconcile with real MT5 state


22. DUPLICATE ORDER PROTECTION
------------------------------
While an order request is pending:

NO SECOND ORDER from the same setup.

Wait for MT5 response.

Only after confirmation and state synchronization
may the EA continue to search for another setup.


23. MANUAL TRADE PROTECTION
---------------------------
Bot trades and Manual trades MUST remain isolated.

Bot Magic Number:
778899

CLOSE ALL BOT TRADES:
Only close positions belonging to this Bot.

Never close Manual Trades.

Manual Trade = PROTECTED.


24. START / PAUSE / STOP / CLOSE ALL
-------------------------------------
START:
Begin automatic ICT analysis and trading.

PAUSE:
Block new entries.
Existing positions continue to be managed.

STOP:
Stop the automatic trading/analysis loop for new entries.
Do not automatically close existing positions.

CLOSE ALL BOT TRADES:
Close only Bot positions with Magic Number 778899.

Never close manual positions.


25. HIGH VOLATILITY PROTECTION
------------------------------
Because XAUUSD can move aggressively:

Monitor:
- Spread
- Price range
- Volatility
- Slippage
- Execution latency
- Market data quality

If execution conditions become unsafe:

BLOCK NEW ENTRY.

Do not automatically close existing positions solely because
of high volatility.


26. NEWS FILTER
---------------
If a reliable news-data source is available:

News Filter may be configurable ON/OFF.

For configured high-impact news:
Block new entries according to the user's
Before-News and After-News settings.

If news data is unavailable:
Do NOT falsely assume "No News".

Use the configured safe behavior.


27. TRADE MANAGEMENT
--------------------
After entry:

Monitor the position.

SL/TP must remain unchanged unless a valid management rule
is triggered.

Optional management features may include:

- Break-even
- Trailing Stop
- ICT-based early exit

No random SL/TP modification.

TP/SL management must follow explicit rules.


28. DASHBOARD STATUS
--------------------
DO NOT redesign the Dashboard.

Only provide accurate status information through the
existing UI where applicable.

Examples:

ANALYZING H4
H4 BULLISH
WAITING FOR LIQUIDITY
LIQUIDITY SWEEP CONFIRMED
WAITING FOR CISD
WAITING FOR M1
WAITING FOR RETRACEMENT
RISK CHECK
READY
EXECUTING
OPEN
MANAGING
CLOSED
ANALYZING AGAIN

If no trade occurs, show the real reason.

Example:
WAITING — NO VALID LIQUIDITY SWEEP
WAITING — CISD NOT CONFIRMED
BLOCKED — DAILY LOSS LIMIT
BLOCKED — COOLDOWN
BLOCKED — MAX OPEN TRADES
BLOCKED — SPREAD TOO HIGH


29. RESTART / RECOVERY
----------------------
If the backend/server/EA restarts:

DO NOT immediately open a new trade.

Perform:

CONNECT MT5
↓
READ REAL OPEN POSITIONS
↓
IDENTIFY BOT POSITIONS
↓
SYNC ACCOUNT
↓
SYNC MARKET DATA
↓
CLEAR STALE SETUPS
↓
RESTORE VALID STATE
↓
FRESH ICT ANALYSIS

Never lose track of existing real positions.


30. TESTING REQUIREMENT
-----------------------
Do not claim "100% PASS" without actual evidence.

Test at minimum:

- H4 Bullish
- H4 Bearish
- Liquidity Sweep
- Stop Hunt
- CISD
- IDM
- Breaker
- PD Array
- M1 Confirmation
- OB
- FVG
- Retracement
- BUY
- SELL
- Fixed Lot 0.01
- Four separate entries
- Duplicate protection
- Dynamic SL
- Minimum SL 10.00
- Dynamic TP
- Minimum TP 10.00
- R:R
- Daily Loss Limit
- Consecutive SL
- Cooldown
- Trading Hours
- MT5 Connection Failure
- MT5 Order Rejection
- Manual Trade Isolation
- CLOSE ALL BOT TRADES
- Restart / Recovery
- High Volatility Protection


31. ACCEPTANCE CRITERIA
-----------------------
The EA is NOT considered complete merely because it
compiles.

It must demonstrate:

1. Correct ICT decision flow
2. Correct XAUUSD-only operation
3. Correct fixed lot execution
4. Correct 4-position independent setup logic
5. Correct SL/TP calculation
6. Correct user risk controls
7. Correct MT5 execution confirmation
8. Correct manual-trade protection
9. Correct error reporting
10. Correct automatic re-analysis
11. No modification of unrelated existing application features


32. FINAL NO-TOUCH POLICY
-------------------------
DO NOT CHANGE: .- Existing Application Template
- Existing Dashboard Design
- Existing UI structure
- Existing API
- Existing API Keys
- Existing Server infrastructure
- Existing MT5 connection
- Existing settings architecture
- Existing working features
- Branding
- Icons
- Other unrelated functionality

ONLY replace/modify the EA trading logic required by this
specification.

Before changing any unrelated file or component, STOP and
report it for approval.

FINAL PRINCIPLE:

"REPLACE THE OLD EA, NOT THE APPLICATION."

Preserve the entire existing working system and integrate
the new ICT XAUUSD EA into the existing architecture.
