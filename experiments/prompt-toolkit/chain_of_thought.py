"""
Chain-of-Thought Prompt Builder
Forces the model to reason step by step before answering.
Best for: decisions, math, debugging, multi-step reasoning.
"""


def build_cot_prompt(question: str, context: str = "") -> str:
    """
    Wraps a question in a CoT prompt structure.
    Optionally accepts context (user background, constraints, etc.)
    """
    context_block = f"\nContext:\n{context}\n" if context else ""

    return f"""You are a careful, structured thinker.{context_block}
Question: {question}

Think through this step by step:
1. What are the key factors involved?
2. What are the possible approaches or options?
3. Analyse each option against the key factors.
4. Based on your analysis, what is the best answer?

Show your reasoning clearly before giving your final answer."""


def main():
    question = "Should I build my startup as a mobile app or a web app?"
    context = "Solo founder, limited budget, targeting GenZ users who are heavy mobile users."

    prompt = build_cot_prompt(question, context)
    print("=" * 60)
    print("CHAIN-OF-THOUGHT PROMPT")
    print("=" * 60)
    print(prompt)


if __name__ == "__main__":
    main()
