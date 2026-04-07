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

            # Send the message
            await client.query(user_input)

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
