# 🚀 Quick Start Guide

Get your test automation framework running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
npx playwright install
```

## Step 2: Configure Environment (Optional)

```bash
cp .env.example .env
```

Edit `.env` if you want to:
- Change the base URL
- Add your OpenAI API key for GPT-powered parsing

## Step 3: Write Your Test Cases

Create a text file in `manual-test-cases/` folder:

**Example: `manual-test-cases/my-test.txt`**
```
Test Case: Login Test
1. Navigate to https://example.com/login
2. Enter username "user@test.com"
3. Enter password "password123"
4. Click login button
5. Verify user is logged in
```

## Step 4: Generate Automated Tests

```bash
npm run generate:tests -- manual-test-cases/my-test.txt
```

This creates `tests/generated/my-test.spec.js`

## Step 5: Run Your Tests

```bash
npm test
```

## Step 6: View Results

```bash
npm run report:html
```

---

## 📝 Test Case Writing Tips

### ✅ Good Examples
- "Navigate to https://example.com/login"
- "Enter username "john@example.com""
- "Click login button"
- "Verify dashboard is displayed"

### ❌ Avoid
- Vague actions: "Do something with the form"
- Missing data: "Enter username" (without value)
- Ambiguous elements: "Click the button" (which button?)

---

## 🎯 Common Commands

| Command | Description |
|---------|-------------|
| `npm run generate:tests -- <file>` | Generate tests from file |
| `npm test` | Run all tests |
| `npm run test:headed` | Run with browser visible |
| `npm run test:debug` | Debug mode |
| `npm run report:html` | View HTML report |

---

## 🆘 Need Help?

Check the full [README.md](README.md) for detailed documentation!

**Happy Testing! 🎉**
