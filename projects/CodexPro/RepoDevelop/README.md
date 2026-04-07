# AI-Powered Test Automation Framework

A Playwright-based framework that converts plain-text manual test cases into executable automated test scripts using a local Ollama model (default: `llama3.2`), with optional GPT fallback and a built-in regex fallback.

## Features

- **Local LLM Parsing**: Uses Ollama with `llama3.2` to intelligently parse manual test cases on your machine
- **Automatic Test Generation**: Converts `.txt` test cases to Playwright `.spec.js` scripts
- **Smart Locator Resolution**: Resolves elements by natural language description with multi-strategy fallback
- **Site Profiles**: Optimised locators for known sites (Amazon, extendable)
- **Auto Cleanup**: Artifacts (screenshots, videos, reports) are wiped before each test run
- **Allure + HTML Reporting**: Two report formats out of the box
- **Retry on CI**: Automatic retries in CI environments
- **.env Driven Config**: All settings controlled from a single `.env` file

## Prerequisites

- Node.js v18+
- [Ollama](https://ollama.com) installed
- `llama3.2` pulled locally

```bash
ollama pull llama3.2
```

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Set up environment
cp .env.example .env
```

## Environment Variables

All configuration lives in `.env` — no need to touch `playwright.config.js`.

```env
# Local Ollama parser (primary)
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://127.0.0.1:11434

# Optional GPT fallback
# OPENAI_API_KEY=your_key_here
# OPENAI_MODEL=gpt-5.4
# OPENAI_BASE_URL=https://api.openai.com/v1

# Browser
HEADLESS=false          # true = headless, false = see the browser
TIMEOUT=30000           # per-test timeout in ms (CI auto-uses 60000)
WORKERS=1

# Artifacts
SCREENSHOT_ON_FAILURE=true
VIDEO_ON_FAILURE=true
```

## Writing Test Cases

Create `.txt` files inside `manual-test-cases/`. Use the quoting convention below.

### Golden Rule: Quote Your Targets

Always put quotes around the text or element you are targeting. This ensures the LLM extracts it correctly.

```
# Text assertion
Verify text "Top Categories" is displayed

# Element visibility
Verify the "search bar" is visible

# Fill a field
Type "glasses" in the search bar

# Hover
Mouse over "Samsung"
```

### Supported Format

```
Test Case: Lenskart Search For Glasses
1. Navigate to https://www.lenskart.com
2. Type "glasses" in the search bar
3. Press Enter
4. Verify the "search results" is visible
5. Wait for 2 seconds
6. Verify page url contains "glasses"

Test Case: Another Test
1. Step one
2. Step two
```

### Supported Actions

| Action | Keywords |
|--------|----------|
| Navigate | `Navigate to`, `Go to`, `Open`, `Launch`, `Head to` |
| Click | `Click`, `Tap`, `Hit`, `Smash` |
| Fill | `Type`, `Enter`, `Key in`, `Fill`, `Put` |
| Press key | `Press Enter`, `Press Tab`, `Press Escape` |
| Select dropdown | `Select`, `Choose from` |
| Hover | `Mouse over`, `Hover over` |
| Verify text | `Verify text "X" is displayed` |
| Verify element | `Verify the "X" is visible` |
| Verify URL | `Verify page url contains "X"` |
| Wait | `Wait for 3 seconds` |
| Scroll | `Scroll to bottom`, `Scroll to top` |

## Generating Tests

```bash
# Single file
npm run generate:tests -- manual-test-cases/lenskart.txt

# Entire directory
npm run generate:tests -- manual-test-cases/
```

> Note: Ollama must be running before generating. Start it with `ollama serve`. If Ollama is unavailable, the framework can optionally try GPT (if configured) and then fall back to the built-in enhanced parser.

Generated tests are placed in `tests/generated/`.

## Running Tests

```bash
# Run all tests (auto-cleans artifacts first)
npm test

# Run with browser visible
npm run test:headed

# Debug mode (skips cleanup — keeps artifacts for inspection)
npm run test:debug

# Run a specific file
npx playwright test tests/generated/lenskart.spec.js
```

## Cleanup

Artifacts (allure-results, playwright-report, test-results) are automatically deleted before every `npm test` and `npm run test:headed` run.

To clean manually at any time:
```bash
npm run clean
```

## Viewing Reports

```bash
# Playwright HTML report
npm run report:html

# Allure report (generates + opens)
npm run report
```

## Framework Structure

```
├── manual-test-cases/          # Plain text test cases (.txt)
├── src/
│   ├── generator/
│   │   └── testGenerator.js    # Converts parsed steps → .spec.js
│   ├── parser/
│   │   └── enhancedTestCaseParser.js  # LLM + regex parser
│   └── utils/
│       ├── locatorHelper.js    # Smart element resolution by description
│       ├── siteProfiles.js     # Site-specific locator hints (Amazon, etc.)
│       └── testHelpers.js      # Utility functions
├── tests/
│   └── generated/              # Auto-generated Playwright specs
├── .env                        # Your local config (gitignored)
├── .env.example                # Config template
└── playwright.config.js        # Reads from .env — do not edit directly
```

## How the LLM Parser Works

1. Your `.txt` file is sent to Ollama (`llama3.2` by default) with a structured few-shot prompt
2. The model returns a JSON array of test cases with typed steps (`navigate`, `fill`, `click`, `verify`, etc.)
3. If Ollama fails and GPT is configured, it can try GPT next
4. If structured output still fails, it falls back to the built-in enhanced parser
5. `TestGenerator` converts the parsed steps into Playwright code

**Parser priority:** Ollama (`llama3.2`) → optional GPT → Regex fallback

## CI/CD

```yaml
name: Playwright CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

> CI runs headless automatically (`HEADLESS` env var defaults to `true` when not set).

## Troubleshooting

**Generator gets stuck / is slow**
- `llama3.2` runs locally, so parsing speed depends on your machine.
- Make sure Ollama is running: `ollama serve`
- If Ollama is unavailable, the framework falls back to the next available parser.

**Tests fail on CI but pass locally**
- Production sites (Amazon, Lenskart, Flipkart) may block cloud CI IPs via bot detection
- Consider running against staging/mock environments for CI

**Elements not found**
- Make sure you quoted the target: `"search bar"` not `search bar`
- Use `npm run test:debug` to inspect with Playwright Inspector

**AI parsing not working**
- Check Ollama is running: `ollama serve`
- Verify the model is installed: `ollama list`
- Confirm `.env` has the correct `OLLAMA_MODEL` / `OLLAMA_URL`
- Framework automatically falls back to the enhanced parser if AI output is invalid or the API call fails

## License

MIT
