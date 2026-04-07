"""
Self-Consistency Prompt Builder
Runs the same question multiple times and picks the most common answer.
Best for: factual questions where hallucination is a risk.
"""

from collections import Counter


def build_self_consistency_prompt(question: str, run_number: int) -> str:
    """
    Builds a single run prompt for self-consistency.
    Call this multiple times with different run_numbers, then aggregate answers.

    Args:
        question: The factual question to answer.
        run_number: Which run this is (for logging/tracking).
    """
    return f"""[Run {run_number}]
Answer the following question directly and concisely.
Do not explain your reasoning — just give the answer.

Question: {question}

Answer:"""


def aggregate_answers(answers: list[str]) -> str:
    """
    Takes a list of answers from multiple runs and returns the most common one.

    Args:
        answers: List of raw answers from each run.
    """
    cleaned = [a.strip().lower() for a in answers]
    most_common, count = Counter(cleaned).most_common(1)[0]
    total = len(answers)
    confidence = (count / total) * 100

    return (
        f"Most common answer: '{most_common}'\n"
        f"Confidence: {count}/{total} runs agreed ({confidence:.0f}%)"
    )


def main():
    question = "What is the capital of Australia?"

    # Simulate 4 runs (in production, you'd call the LLM API 4 times)
    simulated_answers = ["Canberra", "Sydney", "Canberra", "Canberra"]

    print("=" * 60)
    print("SELF-CONSISTENCY PROMPT (single run example)")
    print("=" * 60)
    print(build_self_consistency_prompt(question, run_number=1))

    print("\n" + "=" * 60)
    print("AGGREGATED RESULT (across 4 simulated runs)")
    print("=" * 60)
    print(f"Answers: {simulated_answers}")
    print(aggregate_answers(simulated_answers))


if __name__ == "__main__":
    main()
