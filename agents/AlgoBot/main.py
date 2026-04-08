"""
AlgoBot - Multi-Agent Stock Analysis System
Phase 2 Build: Agent Orchestration Learning

Orchestration Pattern: Parallel (Agents 1-3) + Sequential (Agents 4-5)
- Agents 1, 2, 3 run in parallel (News, Twitter, Price)
- Agent 4 synthesizes their outputs
- Agent 5 (Critic) critiques the recommendation
"""

import asyncio
import json
import sys
from datetime import datetime
from typing import Optional

from agents import (
    NewsAnalyzer,
    TwitterAnalyzer,
    PriceFetcher,
    DecisionSynthesizer,
    CriticAgent,
)


async def analyze_stock(
    ticker: str,
    include_critique: bool = True,
    news_text: str = None,
    tweets: list = None
) -> dict:
    """
    Complete AlgoBot analysis pipeline for a stock.

    Args:
        ticker: Stock ticker (e.g., "TSLA", "RELIANCE.NS")
        include_critique: Whether to include Critic analysis (Agent 5)
        news_text: Optional news text to analyze
        tweets: Optional list of tweets to analyze

    Returns:
        Dict with full analysis including recommendation and critique
    """
    # Stage 1: Parallel analysis (Agents 1-3)
    synthesizer = DecisionSynthesizer()
    recommendation = await synthesizer.orchestrate(ticker, news_text=news_text, tweets=tweets)

    # Stage 2: Critique (Agent 5)
    if include_critique:
        print("\n🧠 Running Critical Analysis...")
        critic = CriticAgent()
        critique = await critic.critique(recommendation)

        return {
            "ticker": ticker,
            "stage_1_recommendation": recommendation,
            "stage_2_critique": critique,
            "final_verdict": {
                "recommendation": recommendation.get("recommendation", "HOLD"),
                "confidence": critique.get("adjusted_confidence",
                                          recommendation.get("confidence", 0)),
                "rationale": critique.get("refined_rationale",
                                         recommendation.get("rationale", "")),
                "caveats": critique.get("caveats", []),
            }
        }
    else:
        return {
            "ticker": ticker,
            "recommendation": recommendation,
        }


def print_analysis(analysis: dict) -> None:
    """Pretty print the analysis results."""
    print("\n" + "=" * 70)
    print("🤖 ALGOBOT FINAL ANALYSIS")
    print("=" * 70)

    ticker = analysis["ticker"]
    final = analysis.get("final_verdict", analysis.get("recommendation", {}))

    print(f"\nTicker: {ticker}")
    print(f"Recommendation: {final.get('recommendation', 'HOLD').upper()}")
    print(f"Confidence: {final.get('confidence', 0):.1%}")
    print(f"\nRationale: {final.get('rationale', 'N/A')}")

    caveats = final.get("caveats", [])
    if caveats:
        print("\n⚠️  Caveats & Warnings:")
        for caveat in caveats:
            print(f"   • {caveat}")

    print("\n" + "=" * 70 + "\n")


async def interactive_mode() -> None:
    """Interactive mode for real-time stock analysis."""
    print("\n" + "=" * 70)
    print("🚀 AlgoBot - Multi-Agent Stock Analysis System")
    print("=" * 70)
    print("\nEnter stock tickers one at a time (e.g., TSLA, RELIANCE.NS)")
    print("Type 'exit' to quit.\n")

    while True:
        try:
            ticker = input("📊 Enter ticker: ").strip().upper()

            if ticker.lower() == "exit":
                print("\n👋 Goodbye!\n")
                break

            if not ticker:
                print("❌ Please enter a valid ticker\n")
                continue

            analysis = await analyze_stock(ticker, include_critique=True)
            print_analysis(analysis)

            # Optionally save to file
            filename = f"algobot_analysis_{ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(analysis, f, indent=2, default=str)
            print(f"✅ Analysis saved to {filename}\n")

        except KeyboardInterrupt:
            print("\n\n👋 Analysis interrupted. Goodbye!\n")
            break
        except Exception as e:
            print(f"\n❌ Error: {str(e)}\n")


async def batch_mode(tickers: list) -> None:
    """Batch analysis for multiple tickers."""
    results = {}

    for ticker in tickers:
        try:
            print(f"\n📊 Analyzing {ticker}...")
            analysis = await analyze_stock(ticker, include_critique=True)
            results[ticker] = analysis
            print_analysis(analysis)
        except Exception as e:
            print(f"❌ Error analyzing {ticker}: {str(e)}")
            results[ticker] = {"error": str(e)}

    # Save batch results
    filename = f"algobot_batch_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(filename, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n✅ Batch analysis saved to {filename}")


async def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        # Batch mode: python main.py TSLA AAPL GOOGL
        tickers = sys.argv[1:]
        await batch_mode(tickers)
    else:
        # Interactive mode
        await interactive_mode()


if __name__ == "__main__":
    asyncio.run(main())
