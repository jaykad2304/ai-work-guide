# AgentsJey

A conversational AI agent that helps you brainstorm ideas and generate production-ready code — built with the Claude Agent SDK.

## What It Does

AgentsJey acts as a thinking partner and coding expert in your terminal. It:

- Asks smart clarifying questions before jumping to solutions
- Explores ideas from multiple angles — edge cases, tradeoffs, alternatives
- Generates clean, well-commented code in any language
- Explains what each part does and offers to extend or refactor

## Stack

- **Python** + `asyncio`
- **Claude Agent SDK** (`claude-agent-sdk`)
- Streaming response output

## Setup

```bash
# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set your API key
cp .env.example .env
# Add your Anthropic API key to .env
```

## Usage

```bash
python main.py
```

Then type your idea or question. Type `exit` to quit.

## Example

```
You: I want to build a CLI tool that monitors my stock watchlist
AgentsJey: Interesting — a few questions to shape this well.
           Are you looking for real-time price alerts, end-of-day summaries,
           or both? And what data source do you have access to — Yahoo Finance,
           a broker API, or something else?
```
