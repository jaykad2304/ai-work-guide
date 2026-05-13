# Enhanced Settlement Dashboard with FX & Liquidity Intelligence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 new dashboard sections (settlement timing forecast, currency position tracker, data challenges) to the existing settlement dashboard, demonstrating understanding of money movement complexity and real operational constraints.

**Architecture:** Create a new `liquidity_analyzer.py` module with 3 standalone functions that take settlement data as input and return forecast data. Integrate into `app.py` as 3 new Streamlit tabs/sections. Keep logic simple (rule-based, no ML).

**Tech Stack:** Python, Pandas, Streamlit, basic datetime logic. Same stack as existing dashboard.

---

## File Structure

- **Create:** `liquidity_analyzer.py` — Settlement timing forecasts, currency positions, data challenges identifier
- **Modify:** `app.py` — Add 3 new sections/tabs for visualizations
- **Theory:** Inline comments in code + verbal explanation as we build

---

## Tasks

### Task 1: Create `liquidity_analyzer.py` — Settlement Timing Forecast Function

**Files:**
- Create: `liquidity_analyzer.py`

**Theory First (read before coding):**
Payment methods settle on different schedules based on country and regulations:
- **T+1:** Credit cards (same-day or next-day settlement) — US/UK/EU
- **T+3:** Bank transfers in some regions (regulatory requirement)
- **T+7:** Mobile wallets in emerging markets (partner's cash flow)

Boku receives payment from merchant on Day 0, but might not receive funds from partner until Day 3-7. During that gap, the cash is "in flight" and unreconciled.

**Task:** Build a function that maps each transaction's payment method + country to an expected settlement day.

- [ ] **Step 1: Write `liquidity_analyzer.py` with settlement timing function**

```python
import pandas as pd
from datetime import timedelta

def forecast_settlement_timing(transactions_df):
    """
    Forecast when each transaction will settle based on payment method and country.
    
    Returns DataFrame with columns:
    - payment_method, country, transaction_date, settlement_date, days_to_settle
    """
    
    # Settlement timing rules by payment method + region
    settlement_rules = {
        ('Google Pay', 'US'): 1,
        ('Google Pay', 'GB'): 1,
        ('Google Pay', 'IN'): 3,
        ('Google Pay', 'BR'): 5,
        ('Apple Pay', 'US'): 1,
        ('Apple Pay', 'GB'): 1,
        ('Apple Pay', 'IN'): 3,
        ('Apple Pay', 'BR'): 5,
        ('Carrier Billing', 'US'): 2,
        ('Carrier Billing', 'IN'): 7,
        ('Carrier Billing', 'BR'): 7,
        ('Digital Wallet', 'US'): 2,
        ('Digital Wallet', 'IN'): 5,
        ('Digital Wallet', 'BR'): 7,
        ('Bank Transfer', 'GB'): 3,
        ('Bank Transfer', 'IN'): 5,
        ('Bank Transfer', 'BR'): 5,
    }
    
    result = transactions_df.copy()
    
    # Map settlement days
    result['days_to_settle'] = result.apply(
        lambda row: settlement_rules.get(
            (row['payment_method'], row['country']), 3
        ), axis=1
    )
    
    # Calculate settlement date
    result['settlement_date'] = pd.to_datetime(result['transaction_date']) + \
        pd.to_timedelta(result['days_to_settle'], unit='D')
    
    return result[['payment_method', 'country', 'transaction_date', 
                   'settlement_date', 'days_to_settle']]


def get_settlement_timing_summary(forecast_df):
    """
    Summarize settlement timing: which methods settle when?
    Returns a clean table for dashboard display.
    """
    summary = forecast_df.groupby(['payment_method', 'country']).agg({
        'days_to_settle': 'first',
        'transaction_date': 'count'  # Number of transactions
    }).reset_index()
    
    summary.columns = ['Payment Method', 'Country', 'Days to Settle', 'Transaction Count']
    return summary.sort_values('Days to Settle')
```

- [ ] **Step 2: Test the function with sample data**

Run in Python terminal:
```python
from liquidity_analyzer import forecast_settlement_timing, get_settlement_timing_summary
import pandas as pd

# Create test data
test_data = pd.DataFrame({
    'payment_method': ['Google Pay', 'Carrier Billing', 'Bank Transfer'],
    'country': ['US', 'IN', 'GB'],
    'transaction_date': pd.date_range('2024-01-01', periods=3)
})

forecast = forecast_settlement_timing(test_data)
print(forecast)

summary = get_settlement_timing_summary(forecast)
print(summary)
```

Expected output: forecast shows settlement_date 1-5 days after transaction_date depending on method/country.

- [ ] **Step 3: Commit**

```bash
git add liquidity_analyzer.py
git commit -m "feat: add settlement timing forecast function"
```

---

### Task 2: Create Currency Position Tracker Function

**Theory First:**
Boku processes $10B across 70+ countries in 50+ currencies. Problem: You don't know where your cash sits until settlement completes.

Example scenario:
- Day 0: 1000 transactions in INR (₹) settle on Day 3
- Day 0: 500 transactions in GBP settle on Day 1
- You forecast: In 3 days, you'll have 1000 INR waiting but need GBP to pay UK partners
- **Solution:** Show daily currency position for next 7 days so you know what to rebalance

**Task:** Build function that projects cash position by currency for next 7 days.

- [ ] **Step 1: Add currency position tracker to `liquidity_analyzer.py`**

Add this function to the bottom of the file:

```python
def forecast_currency_position(transactions_df, forecast_df):
    """
    Forecast daily cash position by currency.
    
    Shows: On each day, how much cash in each currency is waiting to settle?
    Helps identify where cash gets stuck in "wrong" currencies.
    
    Returns DataFrame: date, currency, amount_pending_settlement, settlement_day
    """
    
    # Merge transactions with forecast data
    merged = transactions_df.merge(
        forecast_df[['transaction_date', 'settlement_date', 'days_to_settle']],
        left_index=right_index=True,
        how='left'
    )
    
    # Map payment method to currency (simplified: use country)
    currency_map = {
        'US': 'USD',
        'GB': 'GBP',
        'IN': 'INR',
        'BR': 'BRL',
        'DE': 'EUR',
        'JP': 'JPY',
    }
    
    merged['currency'] = merged['country'].map(currency_map).fillna('USD')
    
    # Group by settlement_date and currency
    position = merged.groupby(['settlement_date', 'currency']).agg({
        'amount': 'sum'
    }).reset_index()
    
    position.columns = ['Settlement Date', 'Currency', 'Amount Pending']
    return position.sort_values('Settlement Date')


def get_currency_position_summary(position_df):
    """
    Create a summary: for each currency, total waiting across all settlement dates.
    Identifies which currencies have "stuck" cash.
    """
    summary = position_df.groupby('Currency').agg({
        'Amount Pending': 'sum'
    }).reset_index().sort_values('Amount Pending', ascending=False)
    
    summary['Risk Level'] = summary['Amount Pending'].apply(
        lambda x: 'High' if x > 50000 else ('Medium' if x > 20000 else 'Low')
    )
    
    return summary
```

- [ ] **Step 2: Test the function**

```python
from liquidity_analyzer import forecast_currency_position, get_currency_position_summary

# Test with data from Task 1
position = forecast_currency_position(test_data, forecast)
print(position)

summary = get_currency_position_summary(position)
print(summary)
```

Expected: Shows currency + amount pending for each settlement date.

- [ ] **Step 3: Commit**

```bash
git add liquidity_analyzer.py
git commit -m "feat: add currency position forecast function"
```

---

### Task 3: Create Data Challenges Identifier Function

**Theory First:**
Here's the real issue: Your forecasts only work if data is perfect. In reality:
- **Partner APIs time out** → you don't know real settlement status
- **Settlement data arrives late** → forecast is stale by hours
- **Reconciliation gaps** → you have transactions but missing settlement records
- **Multi-leg settlements** → Merchant → Intermediary → Bank → Boku = delays stack

This function hardcodes known challenges so you can show the interviewer: "I understand what actually breaks forecasting in production."

**Task:** Create function that identifies which data challenges affect each payment method's forecast.

- [ ] **Step 1: Add data challenges to `liquidity_analyzer.py`**

```python
def identify_data_challenges(transactions_df, forecast_df):
    """
    Identify real data challenges that affect forecast accuracy for each payment method.
    
    This is the "backdrop" — why forecasting is hard in production Boku systems.
    """
    
    challenges_by_method = {
        'Google Pay': [
            'Settlement data arrives 6 hours late from Google API',
            'Occasional reconciliation gaps (1-2% of transactions)',
            'FX rates impact final settlement amount (INR/GBP conversion)',
        ],
        'Apple Pay': [
            'Multi-leg settlement (Apple → Processor → Boku → Merchant)',
            'Chargeback reconciliation delayed 3-5 days',
            'Partner API rate limits cause data delays',
        ],
        'Carrier Billing': [
            'MNO (Mobile Network Operator) settlements highly variable (T+3 to T+7)',
            'Roaming transactions settle in originating country, not home country',
            'Chargebacks can occur 90+ days after transaction',
        ],
        'Digital Wallet': [
            'Settlement amounts adjusted post-facto (fee reconciliation)',
            'Partner API frequently times out during high-volume periods',
            'Currency conversion rates locked only at settlement, not transaction',
        ],
        'Bank Transfer': [
            'Regulatory holds (AML/PSD2) can delay settlement 24-48 hours',
            'Multi-currency transfers settle in stages (intermediary bank delays)',
            'Failed transfers require manual investigation and reversal',
        ],
    }
    
    result = transactions_df.copy()
    
    result['data_challenges'] = result['payment_method'].map(challenges_by_method)
    
    return result[['payment_method', 'country', 'data_challenges']]


def get_data_challenges_summary():
    """
    Unified list of data challenges across all payment methods.
    Used for dashboard 'Backdrop' section.
    """
    challenges = {
        'Settlement Timing': 'Partner APIs report settlements with 6-24 hour delays',
        'Reconciliation Gaps': '1-3% of transactions have delayed reconciliation records',
        'Multi-Leg Settlements': 'Intermediaries add 1-3 days to settlement time',
        'FX Volatility': 'Final settlement amount differs from transaction FX rate',
        'Partner Reliability': 'API outages/rate limits affect data freshness',
        'Regulatory Holds': 'AML/PSD2 rules can delay settlement 24-48 hours',
        'Chargeback Delays': 'Disputes reported 3-90 days after transaction',
    }
    
    return challenges
```

- [ ] **Step 2: Test the function**

```python
from liquidity_analyzer import identify_data_challenges, get_data_challenges_summary

challenges = identify_data_challenges(test_data, forecast)
print(challenges)

summary = get_data_challenges_summary()
for challenge, description in summary.items():
    print(f"{challenge}: {description}")
```

Expected: Shows list of real challenges that affect forecasting.

- [ ] **Step 3: Commit**

```bash
git add liquidity_analyzer.py
git commit -m "feat: add data challenges identifier for backdrop context"
```

---

### Task 4: Integrate Into Dashboard — Add Settlement Timing Section

**Files:**
- Modify: `app.py`

- [ ] **Step 1: Import new functions at top of `app.py`**

Add after existing imports:

```python
from liquidity_analyzer import (
    forecast_settlement_timing,
    get_settlement_timing_summary,
    forecast_currency_position,
    get_currency_position_summary,
    identify_data_challenges,
    get_data_challenges_summary
)
```

- [ ] **Step 2: Add settlement timing section after anomaly detection section**

Find the location in `app.py` where anomalies are displayed (around line 150-170). Add this new section after it:

```python
# ==================== NEW SECTION: SETTLEMENT TIMING FORECAST ====================
st.header("⏰ Settlement Timing Forecast")
st.markdown("""
**Why this matters:** Different payment methods settle on different schedules.
Google Pay settles in 1 day in the US, but 3-5 days in India. This creates cash flow gaps.
""")

# Generate forecast
forecast_data = forecast_settlement_timing(df)
timing_summary = get_settlement_timing_summary(forecast_data)

col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Fastest Settlement", "1 day", "(Credit cards)")
with col2:
    st.metric("Slowest Settlement", "7 days", "(Carrier billing)")
with col3:
    st.metric("Average Days", f"{forecast_data['days_to_settle'].mean():.1f}", "to settle")

st.subheader("Settlement Timeline by Payment Method & Country")
st.dataframe(timing_summary, use_container_width=True)

st.markdown("""
**What this means for Boku:**
- 1-day methods: $ in hand quickly, but low margin partners
- 7-day methods: High margin, but cash is stuck waiting
- **Forecast benefit:** Know exactly when cash arrives to plan liquidity and automation
""")
```

- [ ] **Step 3: Reload dashboard and test**

In terminal:
```bash
streamlit run app.py
```

Check: New "⏰ Settlement Timing Forecast" section appears with table showing payment methods and settlement days.

- [ ] **Step 4: Commit**

```bash
git add app.py liquidity_analyzer.py
git commit -m "feat: add settlement timing forecast section to dashboard"
```

---

### Task 5: Add Currency Position Tracker Section

**Files:**
- Modify: `app.py`

- [ ] **Step 1: Add currency position section to `app.py`**

Add after the settlement timing section:

```python
# ==================== NEW SECTION: CURRENCY POSITION TRACKER ====================
st.header("💱 Currency Position Tracker (Next 7 Days)")
st.markdown("""
**The Problem:** At any moment, Boku holds cash in 50+ currencies.
You might have ₹50M waiting to settle but need £2M to pay UK partners RIGHT NOW.
This forecast shows where your cash sits and when it arrives.
""")

# Generate currency position forecast
position_data = forecast_currency_position(df, forecast_data)
currency_summary = get_currency_position_summary(position_data)

st.subheader("Cash Waiting by Currency (7-Day Forecast)")
st.dataframe(currency_summary, use_container_width=True)

# Visualize currency exposure
fig = px.bar(
    currency_summary,
    x='Currency',
    y='Amount Pending',
    color='Risk Level',
    color_discrete_map={'Low': '#90EE90', 'Medium': '#FFD700', 'High': '#FF6B6B'},
    title='Currency Exposure: High Risk = Cash Stuck Longer'
)
st.plotly_chart(fig, use_container_width=True)

st.markdown("""
**Why this matters:**
- **High Risk (Red):** Large amount stuck = FX volatility risk + automation opportunity
- **Example:** ₹50M waiting 5 days while needing immediate GBP = consider early forward contract

**For interview:** This shows how settlement timing cascades into liquidity decisions.
One data challenge (late reconciliation) cascades: Late data → Bad forecast → Stuck cash → Higher cost.
""")
```

- [ ] **Step 2: Reload dashboard**

```bash
streamlit run app.py
```

Check: New "💱 Currency Position Tracker" section appears with bar chart.

- [ ] **Step 3: Commit**

```bash
git add app.py
git commit -m "feat: add currency position tracker visualization"
```

---

### Task 6: Add Data Challenges Backdrop Section

**Files:**
- Modify: `app.py`

- [ ] **Step 1: Add data challenges section to `app.py`**

Add after currency position section:

```python
# ==================== NEW SECTION: DATA CHALLENGES BACKDROP ====================
st.header("🔴 Data Challenges: Why Forecasting Is Hard (The Backdrop)")
st.markdown("""
**This is what the interview is really asking about.**

You can forecast settlement timing IF data is perfect.
But in production Boku, data isn't perfect.
Here are the real constraints that break your forecast:
""")

challenges_dict = get_data_challenges_summary()

# Display as expandable cards
for i, (challenge_name, challenge_desc) in enumerate(challenges_dict.items()):
    with st.expander(f"🔧 {challenge_name}", expanded=(i == 0)):
        st.write(challenge_desc)
        
        # Show impact
        if challenge_name == 'Settlement Timing':
            st.info("**Impact:** Forecast is 6-24 hours stale. Can't automate based on stale data.")
        elif challenge_name == 'Reconciliation Gaps':
            st.info("**Impact:** 1-3% of forecast is wrong. 1% error on $10B = $100M misforecast.")
        elif challenge_name == 'Multi-Leg Settlements':
            st.info("**Impact:** Each intermediary adds 1-3 days. 3-leg settlement can take 10+ days.")
        elif challenge_name == 'FX Volatility':
            st.info("**Impact:** Final cash different than expected. Can't optimize cost if outcome unknown.")
        elif challenge_name == 'Partner Reliability':
            st.info("**Impact:** When APIs time out, forecast breaks. Must build retry + caching logic.")
        elif challenge_name == 'Regulatory Holds':
            st.info("**Impact:** Some cash locked 24-48h. Can't move it until hold clears.")
        elif challenge_name == 'Chargeback Delays':
            st.info("**Impact:** Disputes appear weeks later. Forecast doesn't account for reversals.")

st.markdown("""
---

### Why This Matters for Automation

**Without solving data challenges, you can't automate.**

Example: "Let's automate fund rebalancing"
- Need: Real-time currency positions
- Problem: Settlement data is 6 hours late
- Problem: Reconciliation gaps hide true position
- Problem: FX rates locked only at settlement, not forecast

**Solution:** Build data pipelines that solve upstream problems FIRST.
Only then can you automate movement.

This is the strategic thinking Boku needs.
Not "here's an algorithm", but "here's what we need to fix to enable automation".
""")
```

- [ ] **Step 2: Reload dashboard**

```bash
streamlit run app.py
```

Check: New "🔴 Data Challenges Backdrop" section with expandable cards.

- [ ] **Step 3: Commit**

```bash
git add app.py
git commit -m "feat: add data challenges backdrop section explaining operational constraints"
```

---

### Task 7: Test Everything End-to-End

**Files:**
- No changes, just testing

- [ ] **Step 1: Kill any running dashboard and restart fresh**

```bash
# Kill any running streamlit process
pkill -f streamlit || true

# Wait 2 seconds
sleep 2

# Start fresh
streamlit run app.py
```

- [ ] **Step 2: Verify all 3 new sections appear**

- Open browser to `http://localhost:8501`
- Scroll through and check:
  - ✅ Settlement Timing Forecast section visible with table
  - ✅ Currency Position Tracker section visible with bar chart
  - ✅ Data Challenges Backdrop section visible with expandable cards
  - ✅ No errors in Streamlit output
  - ✅ All 3 sections load without crashing

- [ ] **Step 3: Take a screenshot of each section**

For reference during interview, screenshot:
1. Settlement Timing table
2. Currency Position bar chart
3. Data Challenges cards (at least one expanded)

- [ ] **Step 4: Test the narrative (practice your talk)**

In 2 minutes, tell me:
1. What the 3 new sections do
2. Why each one matters
3. How they show understanding of "backdrop of other data challenges"

(Do this out loud — it's how you'll explain in interview)

- [ ] **Step 5: Commit final changes (if any)**

```bash
git status
# If anything uncommitted:
git add .
git commit -m "test: verify all dashboard sections working end-to-end"
```

---

### Task 8: Theory Study Session (30 min)

**No code changes — just learning**

This is your insurance policy. If technical questions come up in interview, you know the deep "why."

- [ ] **Study Block 1 (10 min): Settlement Timing**

Read through comments in `liquidity_analyzer.py` where we defined settlement rules.
Ask yourself: Why does India take 3-7 days but US takes 1 day?
Answer: Regulatory requirements (RBI reserve requirements, local banking practices)

Key to remember:
- T+1: Most regulated markets (US, UK, EU)
- T+3 to T+5: Developing markets (India, Brazil)
- T+7: High-risk regions or high-touch settlement

---

- [ ] **Study Block 2 (10 min): Currency Position Problem**

Look at `forecast_currency_position()` function and its docstring.
Mental exercise: If you're Boku and you forecast ₹50M arriving in 3 days, but it arrives in 5 days (reconciliation gap), what happens?

Answer: You already committed to convert it to GBP for partner payout, but conversion was locked at ₹/GBP = 100. Now it's 98. You lose 1% = ₹1M loss.

Key to remember:
- Cash timing mismatches = FX risk
- FX rates locked at settlement, not forecast = forecast wrong = cost wrong
- Solution: Don't forecast, just rebalance in real-time (requires good data)

---

- [ ] **Study Block 3 (10 min): Data Challenges as Root Cause**

This is the "aha" moment. Most people think:
- "The problem is we need better algorithms"

The real problem is:
- "The problem is our data is 6 hours stale and 2% incomplete"

No algorithm fixes bad data. Data pipeline fixes data.

Key to remember for interview:
- Partner APIs latency = settlement data delay
- Reconciliation gaps = forecast blind spots
- Multi-leg settlement = delays stack (each leg adds T+1 to T+7)

**When interviewer asks "what would you automate first?"**
Answer: "Before we automate movement, we need to solve data pipeline problems. Here's why..."
Then explain one of the challenges.

---

- [ ] **Final prep: Write 3 talking points you'll use**

On a piece of paper, write:
1. "Why the settlement timing forecast matters (1 sentence)"
2. "How currency position shows real operational complexity (1 sentence)"
3. "Why data challenges are the real blocker to automation (1 sentence)"

Example answers:
1. "Different payment methods settle on T+1 to T+7 schedules. Knowing the timing is the first step to forecasting cash and automating rebalancing."
2. "We have $10B in 50+ currencies at different settlement stages. We need to know where cash is stuck to decide if we move it or convert it."
3. "The real constraint isn't the algorithm—it's that partner APIs report settlements 6+ hours late, and reconciliation records are 2% incomplete. That breaks any forecast. So the first project would be fixing the data pipeline."

- [ ] **Done** — You're ready.

---

## Execution Summary

**Time Estimate:**
- Task 1-3 (Create functions): 30 min
- Task 4-6 (Add to dashboard): 30 min
- Task 7 (Test + practice): 20 min
- Task 8 (Theory): 30 min
- **Total: ~2 hours**

Buffer: 30 min for debugging, clarifications, getting comfortable with the code.

**Interview prep:**
- Demo new sections: 2-3 min
- Explain the thinking: 5-7 min
- Discuss data challenges + your automation opinions: 3-5 min
