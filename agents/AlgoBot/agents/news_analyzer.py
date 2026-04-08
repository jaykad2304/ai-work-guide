"""
News Analyzer Agent - Analyzes news sentiment for a stock.
Uses Claude to analyze provided news articles or generate analysis.
No external API keys required.
"""

import json
import asyncio
from typing import Optional

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import TextBlock, AssistantMessage, ResultMessage


class NewsAnalyzer:
    def __init__(self):
        # Claude SDK automatically picks up ANTHROPIC_API_KEY from environment
        self.options = ClaudeAgentOptions(
            system_prompt="You are a financial news analyst. Analyze sentiment strictly as JSON with no markdown formatting."
        )

    async def analyze(self, ticker: str, news_text: Optional[str] = None) -> dict:
        """
        Analyze news sentiment for a stock.

        Args:
            ticker: Stock ticker (e.g., "TSLA")
            news_text: News articles text to analyze. If None, Claude generates sample analysis.

        Returns:
            Dict with sentiment analysis and key themes
        """
        if not news_text:
            # Claude generates realistic news analysis based on ticker knowledge
            news_text = f"Recent news about {ticker} stock"

        analysis_prompt = f"""
Analyze the sentiment of news about {ticker} stock.
If no specific news is provided, generate a realistic sentiment analysis based on recent market knowledge.

News text to analyze:
{news_text}

Return a JSON response with:
- sentiment: "bullish", "bearish", or "neutral"
- score: -1.0 (very bearish) to 1.0 (very bullish)
- key_themes: list of 3-4 main topics from the news
- summary: one-sentence summary of the sentiment

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
                "source": "news_analyzer",
                "sentiment": analysis.get("sentiment", "neutral"),
                "score": analysis.get("score", 0),
                "key_themes": analysis.get("key_themes", []),
                "summary": analysis.get("summary", ""),
            }
        except (json.JSONDecodeError, ValueError) as e:
            return {
                "ticker": ticker,
                "source": "news_analyzer",
                "sentiment": "neutral",
                "score": 0,
                "error": f"Failed to parse sentiment: {str(e)}",
                "key_themes": [],
                "summary": "Unable to analyze news sentiment",
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
    """Test the News Analyzer agent."""
    analyzer = NewsAnalyzer()

    # Test with sample news
    sample_news = """Tesla announced a new partnership with major chip manufacturer.
The stock jumped 3% on the news. Analysts are bullish on the partnership potential."""
    result = await analyzer.analyze("TSLA", news_text=sample_news)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
