"""
AgentsJey - Brainstorming + Coding Agent
A Claude-powered agent that helps you explore ideas and generate code.
"""

import asyncio
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import AssistantMessage, ResultMessage, TextBlock


SYSTEM_PROMPT = """You are AgentsJey, an expert brainstorming and coding assistant.

Your job is to:
1. **Brainstorm** — Help the user deeply explore their ideas. Ask clarifying questions,
   expand on concepts, identify edge cases, suggest improvements, and think through
   different angles of the idea.
2. **Generate Code** — Once ideas are clear, produce clean, well-commented, production-ready
   code in whatever language the user prefers.

Your workflow:
- First, understand the idea fully before jumping to code.
- Ask smart questions to uncover requirements the user haven't thought of.
- Suggest alternative approaches or improvements.
- When writing code, explain what each part does.
- Always offer to extend, refactor, or explain the generated code further.

Be conversational, creative, and thorough. You're both a thinking partner and a coding expert.
"""

# Intent → temperature mapping
# Low temp (0.2): precise, deterministic tasks (coding, debugging, math)
# High temp (0.9): open-ended, creative tasks (brainstorming, ideation)
# Mid temp (0.5): balanced tasks (explanation, analysis, Q&A)

CODING_KEYWORDS = [
    "write", "code", "function", "implement", "build", "program",
    "debug", "fix", "refactor", "script", "class", "method",
    "algorithm", "api", "syntax", "compile", "error", "bug",
    "variable", "loop", "array", "object", "test", "unit test",
]

BRAINSTORM_KEYWORDS = [
    "brainstorm", "idea", "imagine", "explore", "creative", "what if",
    "suggest", "possibilities", "invent", "design", "concept", "vision",
    "inspire", "think", "generate ideas", "pitch", "startup", "innovate",
    "dream", "hypothetical", "alternatives", "reimagine", "experiment",
]

ANALYTICAL_KEYWORDS = [
    "explain", "how", "why", "what", "analyze", "compare", "difference",
    "understand", "describe", "summarize", "review", "evaluate", "assess",
    "pros", "cons", "tradeoff", "overview", "clarify", "define", "example",
]

# Behavioral instructions injected per intent to steer response style
TONE_DIRECTIVES = {
    "coding": (
        "[Respond with precision and correctness. "
        "Write clean, production-ready code with minimal creative deviation.]"
    ),
    "brainstorming": (
        "[Respond with creativity and openness. "
        "Explore many angles, offer diverse ideas, and think outside the box.]"
    ),
    "analytical": (
        "[Respond in a balanced, clear, and structured way. "
        "Explain reasoning step by step without over-speculating.]"
    ),
}


def detect_intent(text: str) -> tuple[str, float]:
    """Return (intent, temperature) based on keyword matching."""
    lowered = text.lower()

    coding_score = sum(1 for kw in CODING_KEYWORDS if kw in lowered)
    brainstorm_score = sum(1 for kw in BRAINSTORM_KEYWORDS if kw in lowered)
    analytical_score = sum(1 for kw in ANALYTICAL_KEYWORDS if kw in lowered)

    if coding_score >= brainstorm_score and coding_score >= analytical_score:
        return "coding", 0.2
    if brainstorm_score >= analytical_score:
        return "brainstorming", 0.9
    return "analytical", 0.5


async def run():
    options = ClaudeAgentOptions(
        system_prompt=SYSTEM_PROMPT,
        permission_mode="dontAsk",
    )

    print("=" * 60)
    print("  AgentsJey — Brainstorming + Coding Agent")
    print("  Type your idea or question. Type 'exit' to quit.")
    print("=" * 60)
    print()

    async with ClaudeSDKClient(options=options) as client:
        while True:
            try:
                user_input = input("You: ").strip()
            except (KeyboardInterrupt, EOFError):
                print("\nGoodbye!")
                break

            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit", "bye"):
                print("Goodbye!")
                break

            # Detect intent and set temperature
            intent, temperature = detect_intent(user_input)
            print(f"[🌡 Intent: {intent} | Temperature: {temperature}]")

            # Prepend a tone directive that mimics the effect of temperature
            directive = TONE_DIRECTIVES[intent]
            augmented_input = f"{directive}\n\n{user_input}"

            # Send the message
            await client.query(augmented_input)

            print("\nAgentsJey: ", end="", flush=True)

            # Stream the response until ResultMessage
            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            print(block.text, end="", flush=True)
                elif isinstance(message, ResultMessage):
                    cost = getattr(message, "total_cost_usd", None)
                    if cost:
                        print(f"\n\n[Cost: ${cost:.4f}]", end="")

            print("\n")


if __name__ == "__main__":
    asyncio.run(run())
