# 🎯 Test Automation Framework Overview

## What This Framework Does

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Manual Test Cases (Plain Text)                            │
│  ─────────────────────────────                             │
│                                                             │
│  Test Case: Login                                           │
│  1. Navigate to https://example.com/login                   │
│  2. Enter username "user@test.com"                          │
│  3. Enter password "pass123"                                │
│  4. Click login button                                      │
│  5. Verify dashboard is displayed                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   [Test Generator]
                   (AI-Powered Parser)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Playwright Test Script (JavaScript)                        │
│  ────────────────────────────────────                       │
│                                                             │
│  import { test, expect } from '@playwright/test';          │
│                                                             │
│  test('Login', async ({ page }) => {                        │
│    await page.goto('https://example.com/login');            │
│    await page.fill('input[name="username"]',                │
│                    'user@test.com');                        │
│    await page.fill('input[type="password"]',                │
│                    'pass123');                              │
│    await page.click('button:has-text("login")');            │
│    await expect(page.locator('.dashboard'))                 │
│             .toBeVisible();                                 │
│  });                                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    [npm test]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Test Execution Results                                     │
│  ──────────────────────                                     │
│                                                             │
│  ✓ Login (5.2s)                                             │
│  ✓ Registration (3.8s)                                      │
│  ✗ Password Reset (timeout)                                 │
│                                                             │
│  2 passed, 1 failed                                         │
│                                                             │
│  📸 Screenshots saved                                       │
│  🎥 Videos recorded                                         │
│  📊 Reports generated                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Features at a Glance

| Feature | Description | Status |
|---------|-------------|--------|
| 🤖 AI-Powered Parsing | Uses GPT-5.4 API to understand test cases | ✅ Optional |
| 🔄 Auto Test Generation | Converts text → Playwright code | ✅ Core |
| 📸 Screenshot on Failure | Auto-captures failed test states | ✅ Enabled |
| ▶️ Single Worker Execution | One test at a time for simpler debugging | ✅ Enabled |
| 📊 Allure Reporting | Beautiful HTML reports | ✅ Configured |
| 🌐 Cross-Browser | Chrome, Firefox, Safari, Mobile | ✅ All browsers |
| 🎭 Page Objects | Organized, maintainable structure | ✅ Included |
| 🔁 Retry Logic | Auto-retry flaky tests | ✅ CI mode |

## Framework Structure

```
test-automation-framework/
│
├── 📝 Documentation
│   ├── README.md          # Main documentation
│   ├── QUICKSTART.md      # 5-minute setup guide
│   ├── TUTORIAL.md        # Step-by-step tutorial
│   └── ADVANCED.md        # Advanced configurations
│
├── 📁 Source Code
│   └── src/
│       ├── generator/
│       │   └── testGenerator.js      # 🎯 Converts text → tests
│       ├── parser/
│       │   └── testCaseParser.js     # 🧠 Parses test cases
│       ├── pages/
│       │   ├── BasePage.js           # Base page object
│       │   └── LoginPage.js          # Example page object
│       └── utils/
│           └── testHelpers.js        # Utility functions
│
├── ✍️ Manual Test Cases
│   └── manual-test-cases/
│       ├── sample-tests.txt          # Example test cases
│       └── ecommerce-tests.txt       # E-commerce examples
│
├── 🧪 Generated Tests
│   └── tests/
│       └── generated/
│           └── sample-tests.spec.js  # Auto-generated tests
│
├── ⚙️ Configuration
│   ├── playwright.config.js          # Playwright settings
│   ├── package.json                  # Dependencies
│   └── .env.example                  # Environment template
│
└── 📊 Reports (after running tests)
    ├── playwright-report/            # HTML reports
    ├── allure-results/               # Allure data
    └── test-results/                 # Screenshots, videos
```

## How It Works

### 1️⃣ Write Manual Test Cases
Create simple text files with your test steps:
```
Test Case: User Login
1. Navigate to login page
2. Enter credentials
3. Click login
4. Verify success
```

### 2️⃣ Generate Automated Tests
Run the generator:
```bash
npm run generate:tests -- manual-test-cases/my-test.txt
```

### 3️⃣ Execute Tests
Run in multiple ways:
```bash
npm test                    # All tests
npm run test:headed         # With browser visible
npm run test:debug          # Debug mode
```

### 4️⃣ View Results
Check reports:
```bash
npm run report:html         # Playwright report
npm run report              # Allure report
```

## Supported Actions

| Action Type | Keywords | Example |
|------------|----------|---------|
| Navigate | Navigate, Go to, Open | Navigate to https://example.com |
| Click | Click, Press | Click login button |
| Fill | Enter, Type, Input | Enter username "test@example.com" |
| Select | Select, Choose | Select "California" from state dropdown |
| Verify | Verify, Check, Assert | Verify success message is displayed |
| Wait | Wait for | Wait for results to load |

## Quick Commands

```bash
# Setup
npm install
npx playwright install

# Generate tests
npm run generate:tests -- <file-or-directory>

# Run tests
npm test                          # All tests
npm run test:headed              # Headed mode
npm run test:debug               # Debug mode
npx playwright test <file>       # Specific file

# View reports
npm run report:html              # Playwright report
npm run report                   # Allure report
```

## Example Workflow

```bash
# 1. Create test case file
echo "Test Case: Login
1. Navigate to https://example.com/login
2. Enter username \"user@test.com\"
3. Enter password \"pass123\"
4. Click login button
5. Verify dashboard is displayed" > manual-test-cases/login.txt

# 2. Generate test
npm run generate:tests -- manual-test-cases/login.txt

# 3. Run test
npm test tests/generated/login.spec.js

# 4. View results
npm run report:html
```

## Success Metrics

After setup, you should be able to:
- ✅ Write test cases in plain English
- ✅ Generate tests in seconds
- ✅ Run tests across browsers
- ✅ Get screenshots on failures
- ✅ View detailed reports
- ✅ Run tests one at a time
- ✅ Integrate with CI/CD

## What's Included

### ✅ Ready to Use
- Complete Playwright setup
- Test generator with AI support
- Sample test cases
- Page object examples
- Utility functions
- Multi-browser config
- Reporting setup

### 📚 Documentation
- Quick start guide
- Complete tutorial
- Advanced configuration
- Best practices
- Troubleshooting tips

### 🎁 Extras
- Screenshot on failure
- Video recording
- Allure reports
- Single worker execution
- Retry logic
- Multiple browsers
- Mobile viewports

## Next Steps

1. **Install dependencies**: `npm install && npx playwright install`
2. **Read QUICKSTART.md**: 5-minute guide to get running
3. **Try sample tests**: Generate from provided examples
4. **Create your tests**: Write test cases for your app
5. **Customize**: Adapt to your specific needs

---

**Ready to automate? Start with QUICKSTART.md! 🚀**
