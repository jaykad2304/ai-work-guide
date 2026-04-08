"""
Critic Agent - Questions recommendations and provides deeper insights.
A generic, reusable agent that critically analyzes decisions.
"""

import json
import asyncio
from typing import Dict, Any

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import TextBlock, AssistantMessage, ResultMessage


class CriticAgent:
    def __init__(self):
        # Claude SDK automatically picks up ANTHROPIC_API_KEY from environment
        self.options = ClaudeAgentOptions(
            system_prompt="""You are a devil's advocate financial analyst.
Your role is to question assumptions, identify risks, and provide critical perspective.
Think deeply about what could be wrong or missing. Always return valid JSON with no markdown."""
        )

    async def critique(self, recommendation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Critically analyze the synthesized recommendation.
        Questions assumptions and highlights gaps.

        Args:
            recommendation: Output from DecisionSynthesizer

        Returns:
            Dict with critique, caveats, and refined insights
        """
        ticker = recommendation.get("ticker", "UNKNOWN")

        critique_prompt = f"""
You are a critical analyst reviewing an investment recommendation.
Your job is to question assumptions, identify blind spots, and provide deeper insights.

RECOMMENDATION TO CRITIQUE:
{json.dumps(recommendation, indent=2)}

Analyze this recommendation critically. Provide a JSON response with:
- verdict: "agree", "partial", or "disagree" with the recommendation
- key_assumptions: list of assumptions the recommendation makes
- blind_spots: potential issues or missing considerations
- alternative_scenarios: 2-3 "what if" scenarios that could change the recommendation
- confidence_adjusted: revised confidence score (0-1) after critical review
- caveats: important warnings or conditions
- refined_rationale: your refined perspective after critique

Response (JSON only):
"""

        critique_result = await self._critique_async(critique_prompt)

        return {
            "ticker": ticker,
            "original_recommendation": recommendation.get("recommendation", "HOLD"),
            "original_confidence": recommendation.get("confidence", 0),
            "critique": critique_result.get("verdict", "unknown"),
            "adjusted_confidence": critique_result.get("confidence_adjusted",
                                                       recommendation.get("confidence", 0)),
            "key_assumptions": critique_result.get("key_assumptions", []),
            "blind_spots": critique_result.get("blind_spots", []),
            "alternative_scenarios": critique_result.get("alternative_scenarios", []),
            "caveats": critique_result.get("caveats", []),
            "refined_rationale": critique_result.get("refined_rationale", ""),
        }

    async def _critique_async(self, prompt: str) -> Dict[str, Any]:
        """Call Claude SDK asynchronously for critique."""
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
                "verdict": "unknown",
                "caveats": ["Unable to parse detailed critique"],
            }


async def main():
    """Test the Critic Agent."""
    critic = CriticAgent()

    # Sample recommendation to critique
    sample_recommendation = {
        "ticker": "TSLA",
        "recommendation": "BUY",
        "confidence": 0.75,
        "rationale": "News is bullish, Twitter sentiment positive, price near SMA support",
        "key_factors": [
            "Positive news sentiment around AI partnerships",
            "Strong Twitter engagement from retail investors",
            "Price holding above 50-day moving average"
        ],
        "risk_level": "medium",
        "time_horizon": "3-6 months"
    }

    critique = await critic.critique(sample_recommendation)

    print("\n🤔 CRITICAL ANALYSIS:")
    print("=" * 50)
    print(json.dumps(critique, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
