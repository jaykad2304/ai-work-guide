"""
ReAct Prompt Builder
Structures prompts for agents that alternate between reasoning and acting.
Best for: agents with tools, multi-step tasks that need external information.
"""


def build_react_prompt(task: str, tools: list[str]) -> str:
    """
    Builds a ReAct-style prompt for an agent with access to tools.

    Args:
        task: The task the agent needs to complete.
        tools: List of tool names the agent can use.
    """
    tools_list = "\n".join(f"- {tool}" for tool in tools)

    return f"""You are an agent that solves tasks by alternating between reasoning and acting.

Available tools:
{tools_list}

Use this exact format for every step:

Thought: [what you need to do next and why]
Action: [tool_name]("[input to the tool]")
Observation: [result of the action]
... (repeat Thought/Action/Observation as needed)
Thought: [I now have enough information to answer]
Answer: [your final answer]

Task: {task}

Begin."""


def main():
    task = "What is the current stock price of RELIANCE and is it above its 52-week average?"
    tools = ["search(query)", "get_stock_price(symbol)", "get_52week_average(symbol)"]

    prompt = build_react_prompt(task, tools)
    print("=" * 60)
    print("REACT PROMPT")
    print("=" * 60)
    print(prompt)


if __name__ == "__main__":
    main()
