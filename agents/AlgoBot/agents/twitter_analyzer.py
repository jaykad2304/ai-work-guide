"""
Twitter/X Analyzer Agent - Analyzes Twitter sentiment for a stock.
Uses Claude to analyze provided tweets or generate sentiment analysis.
No external API keys required.
"""

import json
import asyncio
from typing import Optional, List

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import TextBlock, AssistantMessage, ResultMessage


class TwitterAnalyzer:
    def __init__(self):
        # Claude SDK automatically picks up ANTHROPIC_API_KEY from environment
        self.options = ClaudeAgentOptions(
            system_prompt="You are a financial sentiment analyst specializing in social media signals. Analyze strictly as JSON with no markdown formatting."
        )

    async def analyze(self, ticker: str, tweets: Optional[List[str]] = None) -> dict:
        """
        Analyze Twitter sentiment for a stock.

        Args:
            ticker: Stock ticker (e.g., "TSLA")
            tweets: List of tweet texts to analyze. If None, Claude generates realistic analysis.

        Returns:
            Dict with sentiment analysis and trading signals
        """
        if not tweets:
            tweets_text = f"Recent Twitter conversations about {ticker} stock"
        else:
            tweets_text = "\n".join([f"- {t}" for t in tweets])

        analysis_prompt = f"""
Analyze the sentiment of these tweets about {ticker} stock.
If no specific tweets are provided, generate a realistic sentiment analysis based on typical social media patterns.

Tweets about {ticker}:
{tweets_text}

Return a JSON response with:
- sentiment: "bullish", "bearish", or "neutral"
- trading_signal: "buy", "sell", "hold"
- score: -1.0 (very bearish) to 1.0 (very bullish)
- key_insights: list of 3-4 main observations
- summary: one-sentence trading perspective

Response (JSON only, no markdown):
"""

        try:
            response_text = await self._call_claude_async(analysis_prompt)

            # Parse Claude's response
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]

            analysis = json.loads(response_text)

            return {
                "ticker": ticker,
                "source": "twitter_analyzer",
                "sentiment": analysis.get("sentiment", "neutral"),
                "trading_signal": analysis.get("trading_signal", "hold"),
                "score": analysis.get("score", 0),
                "key_insights": analysis.get("key_insights", []),
                "summary": analysis.get("summary", ""),
            }
        except (json.JSONDecodeError, ValueError) as e:
            return {
                "ticker": ticker,
                "source": "twitter_analyzer",
                "sentiment": "neutral",
                "trading_signal": "hold",
                "score": 0,
                "error": f"Failed to parse sentiment: {str(e)}",
                "key_insights": [],
                "summary": "Unable to analyze Twitter sentiment",
            }

    async def _call_claude_async(self, prompt: str) -> str:
        """Call Claude SDK asynchronously."""
        async with ClaudeSDKClient(options=self.options) as client:
            await client.query(prompt)

            response_text = ""
            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            response_text += block.text

            return response_text


async def main():
    """Test the Twitter Analyzer agent."""
    analyzer = TwitterAnalyzer()

    # Test with sample tweets
    sample_tweets = [
        "Just bought more TSLA, bullish on the new AI announcements",
        "Tesla's latest earnings beat expectations. Going higher!",
        "Positive sentiment around their energy division expansion",
    ]
    result = await analyzer.analyze("TSLA", tweets=sample_tweets)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
