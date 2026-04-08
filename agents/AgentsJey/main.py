"""
AgentsJey - Brainstorming + Coding Agent
A Claude-powered agent that helps you explore ideas and generate code.

Memory layers:
  - Session memory : in-context conversation history, controllable via commands
  - Persistent memory : ~/.agentsjey/memory.json injected at startup,
                        updated with `remember: <fact>` commands
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import AssistantMessage, ResultMessage, TextBlock


# ---------------------------------------------------------------------------
# Persistent memory helpers
# ---------------------------------------------------------------------------

MEMORY_PATH = Path.home() / ".agentsjey" / "memory.json"

DEFAULT_MEMORY: dict = {
    "name": None,
    "preferences": {},
    "facts": [],
    "updated_at": None,
}


def load_persistent_memory() -> dict:
    """Load memory from disk, creating the file with defaults if absent."""
    MEMORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not MEMORY_PATH.exists():
        MEMORY_PATH.write_text(json.dumps(DEFAULT_MEMORY, indent=2))
        return dict(DEFAULT_MEMORY)
    try:
        return json.loads(MEMORY_PATH.read_text())
    except (json.JSONDecodeError, OSError):
        return dict(DEFAULT_MEMORY)


def save_persistent_memory(memory: dict) -> None:
    """Write memory back to disk."""
    memory["updated_at"] = datetime.now().isoformat(timespec="seconds")
    MEMORY_PATH.write_text(json.dumps(memory, indent=2))


def memory_to_prompt_block(memory: dict) -> str:
    """Render memory as a system-prompt section."""
    lines = ["## What I know about you (persistent memory)"]

    if memory.get("name"):
        lines.append(f"- Name: {memory['name']}")

    prefs = memory.get("preferences", {})
    if prefs:
        lines.append("- Preferences:")
        for k, v in prefs.items():
            lines.append(f"    • {k}: {v}")

    facts = memory.get("facts", [])
    if facts:
        lines.append("- Facts:")
        for f in facts:
            lines.append(f"    • {f}")

    if len(lines) == 1:
        return ""  # nothing worth showing yet
    return "\n".join(lines)


def add_fact(memory: dict, fact: str) -> None:
    """Append a deduplicated fact and persist."""
    if fact not in memory["facts"]:
        memory["facts"].append(fact)
        save_persistent_memory(memory)


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

BASE_SYSTEM_PROMPT = """You are AgentsJey, an expert brainstorming and coding assistant.

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

## Special commands the user may send (handle silently, no extra commentary)
- `remember: <fact>`  → acknowledge that you've stored the fact; do not repeat it verbatim.
- `history`           → this is handled by the shell, not you; ignore if it slips through.
- `clear history`     → same as above.
"""


def build_system_prompt(memory: dict) -> str:
    block = memory_to_prompt_block(memory)
    if block:
        return BASE_SYSTEM_PROMPT + "\n\n" + block
    return BASE_SYSTEM_PROMPT


# ---------------------------------------------------------------------------
# Intent detection & tone directives
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Session memory helpers
# ---------------------------------------------------------------------------

def print_history(history: list[dict]) -> None:
    if not history:
        print("[Session history is empty]")
        return
    print(f"\n--- Session history ({len(history)} messages) ---")
    for i, entry in enumerate(history, 1):
        role = entry["role"].upper()
        preview = entry["text"][:120].replace("\n", " ")
        ellipsis = "…" if len(entry["text"]) > 120 else ""
        print(f"  [{i}] {role}: {preview}{ellipsis}")
    print("---\n")


HISTORY_CONTEXT_TURNS = 10


def build_history_context(history: list[dict]) -> str:
    """Summarise recent history as a leading context block for the next query."""
    if not history:
        return ""
    recent = history[-HISTORY_CONTEXT_TURNS:]
    lines = ["[Conversation so far this session:]"]
    for entry in recent:
        role_label = "User" if entry["role"] == "user" else "Assistant"
        text = entry["text"]
        if len(text) > 400:
            text = text[:400] + "…"
        lines.append(f"{role_label}: {text}")
    lines.append("[End of prior context]\n")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

async def run():
    memory = load_persistent_memory()
    system_prompt = build_system_prompt(memory)

    options = ClaudeAgentOptions(
        system_prompt=system_prompt,
        permission_mode="dontAsk",
    )

    print("=" * 60)
    print("  AgentsJey — Brainstorming + Coding Agent")
    print("  Commands: history | clear history | memory | forget | remember: <fact>")
    print("  Type 'exit' to quit.")
    print("=" * 60)
    if memory.get("name"):
        print(f"  Welcome back, {memory['name']}!")
    print()

    # Session memory: list of {role, text} dicts
    session_history: list[dict] = []

    async with ClaudeSDKClient(options=options) as client:
        while True:
            try:
                user_input = input("You: ").strip()
            except (KeyboardInterrupt, EOFError):
                print("\nGoodbye!")
                break

            if not user_input:
                continue

            # --- Built-in shell commands (no SDK call needed) ---

            if user_input.lower() in ("exit", "quit", "bye"):
                print("Goodbye!")
                break

            if user_input.lower() == "history":
                print_history(session_history)
                continue

            if user_input.lower() == "clear history":
                session_history.clear()
                print("[Session history cleared]\n")
                continue

            if user_input.lower() == "memory":
                block = memory_to_prompt_block(memory)
                print(block if block else "[No persistent memory stored yet]")
                print()
                continue

            if user_input.lower() == "forget":
                memory.update({"name": None, "preferences": {}, "facts": []})
                save_persistent_memory(memory)
                print("[Persistent memory cleared]\n")
                continue

            # `remember: <fact>` — store and let agent acknowledge in this turn
            if user_input.lower().startswith("remember:"):
                fact = user_input[len("remember:"):].strip()
                if not fact:
                    print("[Nothing to remember — usage: remember: <fact>]\n")
                    continue
                add_fact(memory, fact)
                print(f"[Stored in persistent memory: \"{fact}\"]\n")
                augmented_input = (
                    f"The user just asked you to remember this fact: \"{fact}\". "
                    f"Acknowledge it briefly and naturally.\n\n"
                    f"Updated memory:\n{memory_to_prompt_block(memory)}"
                )
                await client.query(augmented_input)
                print("\nAgentsJey: ", end="", flush=True)
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
                continue

            # --- Intent detection ---
            intent, temperature = detect_intent(user_input)
            print(f"[Intent: {intent} | Temp: {temperature}]")

            # --- Build augmented query (tone directive + history context) ---
            directive = TONE_DIRECTIVES[intent]
            history_ctx = build_history_context(session_history)
            augmented_input = f"{directive}\n\n{history_ctx}{user_input}"

            # Record user turn in session memory
            session_history.append({"role": "user", "text": user_input})

            # --- Send to SDK ---
            await client.query(augmented_input)

            print("\nAgentsJey: ", end="", flush=True)

            # Collect assistant response for session memory
            assistant_text_parts: list[str] = []

            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            print(block.text, end="", flush=True)
                            assistant_text_parts.append(block.text)
                elif isinstance(message, ResultMessage):
                    cost = getattr(message, "total_cost_usd", None)
                    if cost:
                        print(f"\n\n[Cost: ${cost:.4f}]", end="")

            print("\n")

            # Record assistant turn in session memory
            if assistant_text_parts:
                session_history.append(
                    {"role": "assistant", "text": "".join(assistant_text_parts)}
                )


if __name__ == "__main__":
    asyncio.run(run())
