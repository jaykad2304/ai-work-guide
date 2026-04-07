"""
Tree-of-Thought Prompt Builder
Explores multiple reasoning branches before picking the best answer.
Best for: complex decisions with multiple valid options, high-stakes choices.
"""


def build_tot_prompt(question: str, branches: int = 3, context: str = "") -> str:
    """
    Builds a ToT prompt that forces the model to explore N branches.

    Args:
        question: The decision or problem to reason about.
        branches: Number of distinct approaches to explore (default: 3).
        context: Optional background information.
    """
    context_block = f"\nContext:\n{context}\n" if context else ""
    branch_instructions = "\n".join(
        f"Branch {i+1}: [Option name] → analyse pros, cons, risks → score out of 10"
        for i in range(branches)
    )

    return f"""You are a strategic decision-making assistant.{context_block}
Question: {question}

Explore {branches} distinct approaches to this problem. For each branch:
- Name the approach
- List its pros and cons
- Identify key risks
- Score it out of 10

{branch_instructions}

After exploring all branches:
- Compare the scores
- Consider which risks are acceptable
- Give your final recommendation with clear reasoning."""


def main():
    question = "How should ProjectAlgo decide whether a stock is BUY, SELL, or HOLD?"
    context = (
        "The system has access to: technical indicators (RSI, MACD, ATR), "
        "news sentiment from financial APIs, and macro market data."
    )

    prompt = build_tot_prompt(question, branches=3, context=context)
    print("=" * 60)
    print("TREE-OF-THOUGHT PROMPT")
    print("=" * 60)
    print(prompt)


if __name__ == "__main__":
    main()
