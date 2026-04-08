# AlgoBot - Multi-Agent Stock Analysis System

**Phase 2 Build:** Agent Orchestration & Multi-Agent Systems using Claude SDK only

A sophisticated stock analysis system powered by 5 specialized agents working together. **Zero API key setup required** — Claude SDK handles everything automatically.

## Architecture

### Agents

1. **News Analyzer** - Analyzes news sentiment using Claude
   - Input: News text or ticker (Claude generates realistic analysis)
   - Output: Sentiment score (-1 to +1), key themes, summary

2. **Twitter/X Analyzer** - Analyzes social media sentiment using Claude
   - Input: Tweets or ticker (Claude generates realistic Twitter analysis)
   - Output: Sentiment, trading signals (buy/sell/hold), key insights

3. **Price Fetcher** - Fetches real price data and technical indicators
   - Tools: yfinance (free, no API key needed)
   - Output: Current price, moving averages, volatility, trend analysis

4. **Decision Synthesizer** - Orchestrator combining all 3 agents
   - Pattern: Parallel execution (1, 2, 3) → Sequential synthesis
   - Output: BUY/SELL/HOLD recommendation with confidence

5. **Critic Agent** - Questions assumptions and provides deeper insights (Generic, reusable)
   - Pattern: Sequential (after Synthesizer)
   - Output: Critical analysis, caveats, alternative scenarios

## Orchestration Pattern

```
┌─────────────────────────────────────────┐
│  User Query: "Should I buy TSLA?"       │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼─────────┐
        │ Parallel Stage │
        └──────┬─────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
  │News │  │Twitter   Price │  (Run simultaneously)
  └──┬──┘  └──┬──┘  └──┬──┘
     │        │        │
     └────────┼────────┘
              │
        ┌─────▼──────────┐
        │Synthesizer     │  (Wait for all 3)
        │(Agent 4)       │
        └─────┬──────────┘
              │
        ┌─────▼──────────┐
        │Critic          │  (Sequential)
        │(Agent 5)       │
        └─────┬──────────┘
              │
        ┌─────▼──────────┐
        │Final Verdict   │
        │with Caveats    │
        └────────────────┘
```

## Setup (Same as AgentsJey)

```bash
pip install -r requirements.txt
python main.py
```

**Done!** Claude SDK automatically detects your API key. No configuration needed.

## Usage

### Interactive Mode
```bash
python main.py
```

Enter tickers:
```
📊 Enter ticker: TSLA
📊 Enter ticker: RELIANCE.NS
📊 Enter ticker: exit
```

### With Custom Input
```bash
python main.py TSLA
```

Analyzes single ticker with default Claude-generated sentiment data.

### Programmatic Usage
```python
import asyncio
from main import analyze_stock

async def main():
    # Basic analysis (Claude generates sentiment data)
    result = await analyze_stock("TSLA")
    
    # With custom news/tweets input
    result = await analyze_stock(
        "TSLA",
        news_text="Tesla announced AI partnership, stock jumped 5%",
        tweets=["Just bought TSLA", "Bullish on Tesla energy division"]
    )
    print(result)

asyncio.run(main())
```

## Output Example

```
🤖 ALGOBOT FINAL ANALYSIS
======================================================================

Ticker: TSLA
Recommendation: BUY
Confidence: 82.5%

Rationale: News sentiment is bullish with AI partnership mentions.
Twitter shows strong retail interest. Price above 50-day MA indicating
uptrend. However, earnings uncertainty and macro factors present risks.

⚠️  Caveats & Warnings:
   • Earnings report scheduled for next week could cause volatility
   • Macro headwinds (interest rates) could override technical signals
   • High social media engagement can be overextended before corrections
   • Consider taking partial profits at resistance levels

======================================================================
```

## Learning Outcomes (Phase 2)

After completing this project, you understand:

✅ **ReAct Loop** - Each agent reasons, acts, observes
✅ **Tool Use** - Agents use NewsAPI, Twitter API, yfinance
✅ **Agent Memory** - In-context conversation history
✅ **Orchestration Patterns**:
  - Parallel execution (Agents 1-3 simultaneously)
  - Sequential chaining (4 → 5)
  - Hierarchical dispatch (Synthesizer as manager)

✅ **Multi-Agent Systems** - Specialized agents > single generalist
✅ **Claude Agent SDK** - Full implementation of SDK patterns

## Next Steps

- Phase 3: Add RAG layer (store past analyses, news archives)
- Phase 4: Fine-tune Critic agent on domain-specific patterns
- Phase 5: Add observability (Langfuse tracing, cost/latency metrics)
- Phase 6: Deploy AlgoBot as API with user dashboard

## Portfolio Value

This project demonstrates:
- Multi-agent orchestration in production patterns
- Complex async workflows
- API integration (multiple sources)
- Claude Agent SDK mastery
- System design thinking (specialization, composition)

Push to GitHub and reference in your portfolio as a Phase 2 Proof of Concept.
