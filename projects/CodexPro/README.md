# CodexPro

An AI-powered test automation framework that converts plain-English manual test cases into executable Playwright test scripts — using a local LLM (Ollama) with optional GPT fallback.

## What It Does

Write your tests in plain text:

```
Go to amazon.in
Search for "wireless headphones"
Click the first result
Verify the product title is visible
Add to cart
```

CodexPro parses them with a local LLM and generates fully working Playwright `.spec.js` files — no Playwright knowledge required.

## Features

- **Local LLM parsing** — uses Ollama (`llama3.2`) on your machine, no API costs
- **GPT fallback** — optional OpenAI fallback if Ollama is unavailable
- **Regex fallback** — rule-based parser as last resort
- **Smart locator resolution** — resolves elements by natural language with multi-strategy fallback
- **Site profiles** — optimised locators for known sites (Amazon, Flipkart, Lenskart)
- **Allure + HTML reports** — two report formats out of the box
- **CI-ready** — auto retries, headless mode, GitHub Actions workflow included

## Stack

- **Playwright** (Node.js)
- **Ollama** — local LLM inference (`llama3.2`)
- **OpenAI SDK** — optional GPT fallback

## Setup

```bash
# Install Ollama and pull the model
ollama pull llama3.2

# Install dependencies
npm install
npx playwright install chromium

# Configure
cp .env.example .env
```

## Usage

1. Write your test cases in `.txt` files under `manual-test-cases/`
2. Run the generator:

```bash
node src/generator/testGenerator.js
```

3. Run the generated tests:

```bash
npx playwright test
```

## Project Structure

```
RepoDevelop/
├── src/
│   ├── generator/        # LLM-based test generator
│   ├── parser/           # Enhanced + basic test case parsers
│   └── utils/            # Locator helpers, site profiles, test utilities
├── tests/generated/      # Auto-generated Playwright specs
├── manual-test-cases/    # Plain-text test input files
└── playwright.config.js
```
