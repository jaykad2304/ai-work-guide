# 💳 Payment Settlement Reconciliation Dashboard

AI-powered settlement analysis using Claude's reasoning for anomaly detection, reconciliation, and operational insights.

**Perfect for**: Interview demo showing payment platform ops + engineering teams how to automate settlement reconciliation at scale.

---

## 📊 What This Dashboard Does

- **Analyzes** settlement transactions across 300+ payment methods (Alipay, WeChat Pay, Apple Pay, UPI, Boleto, etc.)
- **Detects** anomalies: success rate drops, chargeback spikes, settlement delays
- **Explains** findings using Claude-like reasoning (why these anomalies matter)
- **Recommends** actions with severity levels and owners
- **Visualizes** trends, payment method performance, and reconciliation metrics

**Demo Data**: Generates realistic payment settlement scenarios with chargebacks, reversals, and edge cases.

---

## 🏗️ Architecture

```
Settlement Transactions (70+ countries, 300+ methods)
        ↓
Settlement Analyzer (Claude's Logic)
        ↓
Anomaly Detection & Pattern Recognition
        ↓
Streamlit Dashboard (Ops + Engineering UI)
        ↓
Real-Time Insights & Recommendations
```

**Data Privacy**: Uses synthetic demo data. In production, data stays on-prem or uses secure API with encryption.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- pip or conda
- ~5 minutes to set up

### Option 1: Run from Command Line (Terminal)

**Step 1: Clone and navigate**
```bash
cd /home/jaykumar/Jay/ai-work-guide/projects/boku-settlement-dashboard
```

**Step 2: Create virtual environment** (recommended)
```bash
# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# On Windows:
python -m venv venv
venv\Scripts\activate
```

**Step 3: Install dependencies**
```bash
pip install -r requirements.txt
```

**Step 4: Run the app**
```bash
streamlit run app.py
```

The app will open at `http://localhost:8501`

---

### Option 2: Run from VS Code

**Step 1: Open the project in VS Code**
```bash
code /home/jaykumar/Jay/ai-work-guide/projects/boku-settlement-dashboard
```

**Step 2: Open terminal in VS Code**
- Press `Ctrl + `` (backtick) to open VS Code terminal
- Or go to **Terminal → New Terminal**

**Step 3: Create and activate virtual environment**
```bash
# Terminal will auto-detect Python
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

**Step 4: Install dependencies**
```bash
pip install -r requirements.txt
```

**Step 5: Run the app**
```bash
streamlit run app.py
```

**Step 6: Open in browser**
- Streamlit will show: `Local URL: http://localhost:8501`
- Click the link or paste it into your browser

---

## 📁 Project Structure

```
boku-settlement-dashboard/
├── app.py                    # Main Streamlit dashboard
├── settlement_analyzer.py    # Claude's analysis logic
├── sample_data.py           # Generate realistic settlement data
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

### File Explanations

**`sample_data.py`** - Generates synthetic but realistic payment settlement data
- Creates transactions across 8 payment methods (simulates 300+ in production)
- Adds natural anomalies: chargebacks (1%), reversals (2%)
- Injects edge cases: success rate drops, volume spikes
- **Why**: Proves the dashboard works without needing real production data

**`settlement_analyzer.py`** - Shows how Claude would analyze the data
- Calculates daily settlement metrics
- Detects anomalies using statistical reasoning
- Generates Claude-style explanations ("Why did this happen?")
- Produces actionable recommendations
- **Why**: Demonstrates Claude's reasoning without API keys

**`app.py`** - Interactive Streamlit dashboard
- Displays settlement overview (transactions, value, countries)
- Shows Claude's analysis & reasoning
- Visualizes trends and payment method performance
- Allows filtering & exploration of raw data
- **Why**: Makes the analysis visible and interactive for demo

---

## 🎯 How to Use in the Interview

### The Demo Flow (10 minutes)

1. **Start the app** (2 min)
   ```bash
   streamlit run app.py
   ```

2. **Show the Overview** (1 min)
   - "Here's settlement data from a typical day"
   - Point out: 15K+ transactions, $2.1M settled, 8 payment methods

3. **Highlight Claude's Analysis** (3 min)
   - "Claude detects 2-3 anomalies automatically"
   - Explain each:
     - Success rate drops → investigate API connectivity
     - Chargebacks spike → check for billing errors
     - Reversals jump → contact payment provider
   - Say: *"This is how Claude would analyze your settlement data securely on-prem"*

4. **Show Visualizations** (2 min)
   - Daily trends: success rates going down
   - Payment method breakdown: which methods have issues
   - Filter by method/status to explore edge cases

5. **Explain the Architecture** (2 min)
   - "Data never leaves your payment infrastructure"
   - "Claude runs via secure API with encryption"
   - "Compliant with PSD2, AML, and local regulations"
   - Show the code: Point out `SettlementAnalyzer` can swap mocks for real API

### Interview Talking Points

**When they ask: "How would real Claude API work?"**
> "In `settlement_analyzer.py`, line 40, you see `_call_claude_api()`. Right now it's mocked for the demo, but with an API key it would:
> - Send settlement data in a secure payload
> - Claude analyzes on Anthropic's infrastructure
> - Returns anomalies + reasoning
> - Data residency options: EU, US, or on-prem via API"

**When they ask: "What about sensitive data?"**
> "Great question. The data sent to Claude would be:
> 1. Encrypted in transit
> 2. Processed without storage
> 3. Deleted after analysis
> 4. Compliant with GDPR/PSD2
> This demo uses synthetic data to show the pattern."

**When they ask: "What's the next step?"**
> "Phase 1 (this demo): anomaly detection ✅
> Phase 2: Auto-remediation (halt settlements, alert teams)
> Phase 3: Cross-currency optimization
> Phase 4: Chargeback prediction"

---

## 🔧 Customizing the Dashboard

### Change the data
Edit `sample_data.py`:
```python
# Line 20: Modify payment methods
payment_methods = {
    'Alipay': {...},
    'Your Method': {...},
}
```

### Add more anomaly types
Edit `settlement_analyzer.py`:
```python
# Line 110: Add new anomaly detection
if method['success_rate'] < 95:
    anomalies.append({
        'type': 'low_success_rate',
        'severity': 'high',
        ...
    })
```

### Customize dashboard layout
Edit `app.py`:
```python
# Streamlit is highly customizable
# Change metrics, charts, filters, etc.
```

---

## 🔌 Ready to Add Real Claude API?

When you have an API key, update `settlement_analyzer.py`:

```python
def _call_claude_api(self) -> Dict[str, Any]:
    """Call real Claude API for analysis."""
    
    from anthropic import Anthropic
    
    client = Anthropic()
    
    # Prepare settlement data summary
    prompt = f"""
    Analyze this settlement data for anomalies:
    {json.dumps(self.df.to_dict())}
    
    Return JSON with anomalies, severity, recommendations.
    """
    
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return json.loads(message.content[0].text)
```

---

## 📝 Project Notes for Interview

### Why This Approach?

✅ **Data Privacy First**: No real payment data exposed
✅ **Architecture Clear**: Code shows exactly how Claude integrates
✅ **Interview-Friendly**: Works without API keys, demos smoothly
✅ **Production-Ready**: Easy to swap mocks for real API calls
✅ **Ops + Engineering**: Both audiences see value (UI + code)

### Key Messaging

> "This dashboard automates the problem: with 300+ payment methods and 70+ countries, manual reconciliation doesn't scale. Claude's reasoning layer brings intelligent anomaly detection to payment platform operations."

---

## 🐛 Troubleshooting

**Port 8501 already in use?**
```bash
streamlit run app.py --server.port 8502
```

**Virtual environment issues?**
```bash
# Deactivate current env
deactivate

# Remove and recreate
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Data not loading?**
```bash
# Test the data generator directly
python sample_data.py
```

---

## 📚 Resources

- [Streamlit Docs](https://docs.streamlit.io/)
- [Claude API](https://anthropic.com/api)
- [Plotly Charts](https://plotly.com/python/)

---

**Ready for your interview?** 🚀

This dashboard is your secret weapon to show them you understand:
- Payment operations at scale
- How to use AI for operational intelligence
- Data privacy & security
- Clean, explainable code
