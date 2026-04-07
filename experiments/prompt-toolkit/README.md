# Prompt Toolkit

A collection of reusable prompt pattern builders — each implementing a core LLM prompting technique.

## Patterns

| File | Pattern | Best For |
|---|---|---|
| `chain_of_thought.py` | Chain-of-Thought | Decisions, multi-step reasoning |
| `react.py` | ReAct | Agents with tools |
| `tree_of_thought.py` | Tree-of-Thought | Complex decisions with multiple options |
| `self_consistency.py` | Self-Consistency | Factual questions, reducing hallucination |

## Usage

Each file is standalone. Run any of them directly to see the prompt it generates:

```bash
python chain_of_thought.py
python react.py
python tree_of_thought.py
python self_consistency.py
```

## How to Use in Your Projects

Import the builder function and pass your own question + context:

```python
from chain_of_thought import build_cot_prompt

prompt = build_cot_prompt(
    question="Should I use PostgreSQL or MongoDB?",
    context="Building a social app with flexible user profiles and 10k users."
)
# Send `prompt` to your LLM API
```
