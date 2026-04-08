"""
Decision Synthesizer Agent - Orchestrator that combines analysis from all agents.
Runs News Analyzer, Twitter Analyzer, and Price Fetcher in parallel.
Then synthesizes their outputs into a buy/sell/hold recommendation.
"""

import asyncio
import json
from typing import Dict, Any

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import TextBlock, AssistantMessage, ResultMessage

from .news_analyzer import NewsAnalyzer
from .twitter_analyzer import TwitterAnalyzer
from .price_fetcher import PriceFetcher


class DecisionSynthesizer:
    def __init__(self):
        # Claude SDK automatically picks up ANTHROPIC_API_KEY from environment
        self.options = ClaudeAgentOptions(
            system_prompt="""You are an expert financial analyst synthesizing data from multiple sources.
Provide clear, data-driven recommendations. Always return valid JSON with no markdown."""
        )

        self.news_analyzer = NewsAnalyzer()
        self.twitter_analyzer = TwitterAnalyzer()
        self.price_fetcher = PriceFetcher()

    async def orchestrate(self, ticker: str, news_text: str = None, tweets: list = None) -> Dict[str, Any]:
        """
        Orchestrate all three agents in parallel and synthesize results.

        Args:
            ticker: Stock ticker (e.g., "TSLA")
            news_text: Optional news text to analyze
            tweets: Optional list of tweets to analyze

        Returns:
            Dict with synthesized recommendation
        """
        print(f"\n📊 AlgoBot Analysis for {ticker}")
        print("=" * 50)

        # Run all three agents in parallel
        print("\n🔄 Analyzing from all sources...")
        news_result, twitter_result, price_result = await asyncio.gather(
            self.news_analyzer.analyze(ticker, news_text=news_text),
            self.twitter_analyzer.analyze(ticker, tweets=tweets),
            self.price_fetcher.analyze(ticker),
            return_exceptions=True,
        )

        # Handle any exceptions
        if isinstance(news_result, Exception):
            news_result = {"error": str(news_result), "ticker": ticker}
        if isinstance(twitter_result, Exception):
            twitter_result = {"error": str(twitter_result), "ticker": ticker}
        if isinstance(price_result, Exception):
            price_result = {"error": str(price_result), "ticker": ticker}

        print("✅ Data collection complete\n")

        # Prepare synthesis prompt
        synthesis_prompt = f"""
Analyze the following data from multiple sources and provide a synthesized recommendation:

TICKER: {ticker}

NEWS ANALYSIS:
{json.dumps(news_result, indent=2)}

TWITTER/X ANALYSIS:
{json.dumps(twitter_result, indent=2)}

PRICE & TECHNICAL ANALYSIS:
{json.dumps(price_result, indent=2)}

Based on all three sources, provide a JSON response with:
- recommendation: "BUY", "SELL", or "HOLD"
- confidence: 0.0 to 1.0
- rationale: brief explanation
- key_factors: list of 3-5 main factors influencing the recommendation
- risk_level: "low", "medium", "high"
- time_horizon: suggested investment timeframe

Response (JSON only):
"""

        # Call Claude for synthesis
        synthesis = await self._synthesize_async(synthesis_prompt)

        return {
            "ticker": ticker,
            "recommendation": synthesis.get("recommendation", "HOLD"),
            "confidence": synthesis.get("confidence", 0),
            "rationale": synthesis.get("rationale", ""),
            "key_factors": synthesis.get("key_factors", []),
            "risk_level": synthesis.get("risk_level", "unknown"),
            "time_horizon": synthesis.get("time_horizon", ""),
            "sources": {
                "news": news_result,
                "twitter": twitter_result,
                "price": price_result,
            }
        }

    async def _synthesize_async(self, prompt: str) -> Dict[str, Any]:
        """Call Claude SDK asynchronously for synthesis."""
        async with ClaudeSDKClient(options=self.options) as client:
            await client.query(prompt)

            response_text = ""
            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            response_text += block.text

        # Parse JSON
        try:
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]

            return json.loads(response_text)
        except (json.JSONDecodeError, ValueError):
            return {
                "recommendation": "HOLD",
                "confidence": 0.5,
                "rationale": "Unable to parse synthesis, defaulting to HOLD",
            }


async def main():
    """Test the Decision Synthesizer."""
    synthesizer = DecisionSynthesizer()
    result = await synthesizer.orchestrate("TSLA")

    print("\n📈 SYNTHESIZED RECOMMENDATION:")
    print("=" * 50)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
