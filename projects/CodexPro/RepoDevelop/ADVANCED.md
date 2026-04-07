# Advanced Configuration Guide

## Custom Selector Strategies

Edit `src/generator/testGenerator.js` to customize how selectors are generated:

```javascript
generateSelector(elementText) {
  // Add your custom selector logic
  if (elementText.includes('my-custom-pattern')) {
    return '[data-testid="custom-id"]';
  }
  // ... existing logic
}
```

## Custom Test Templates

Modify the test generation template in `generateTestContent()`:

```javascript
generateTestContent(testCases) {
  let content = `import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage.js';

// Your custom imports and setup
`;
  // ... rest of code
}
```

## AI Parsing Customization

Modify the AI prompt in `src/parser/testCaseParser.js`:

```javascript
async parseWithAI(fileContent) {
  const prompt = `
    Parse test cases with these custom rules:
    1. Your rule here
    2. Another rule
    
    Test cases:
    ${fileContent}
  `;
  // ... rest of code
}
```

## Custom Assertions

Add custom verification logic in `generateVerifyCode()`:

```javascript
generateVerifyCode(step) {
  if (step.element.includes('custom-verification')) {
    return `await customVerifyFunction(page, '${step.data}');`;
  }
  // ... existing logic
}
```

## Environment-Specific Configuration

Create multiple config files:

```javascript
// playwright.config.staging.js
import baseConfig from './playwright.config.js';

export default {
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'https://staging.example.com',
  }
};
```

Run with: `npx playwright test --config=playwright.config.staging.js`

## Custom Reporters

Add custom reporter in `playwright.config.js`:

```javascript
reporter: [
  ['html'],
  ['json', { outputFile: 'test-results.json' }],
  ['junit', { outputFile: 'junit-results.xml' }],
  ['./custom-reporter.js']
]
```

## Browser Context Configuration

Set cookies, storage, geolocation:

```javascript
// In your test
test.use({
  storageState: 'auth.json', // Reuse auth state
  geolocation: { longitude: 12.492507, latitude: 41.889938 },
  permissions: ['geolocation'],
  locale: 'en-US',
  timezoneId: 'America/New_York',
});
```

## Network Mocking

```javascript
// In test setup
await page.route('**/api/data', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ mock: 'data' })
  });
});
```

## Visual Regression Testing

Add to tests:

```javascript
await expect(page).toHaveScreenshot('homepage.png');
```

## Performance Testing

```javascript
// Measure page load time
const start = Date.now();
await page.goto('https://example.com');
const loadTime = Date.now() - start;
console.log(`Page loaded in ${loadTime}ms`);
```

## Accessibility Testing

Install: `npm install @axe-core/playwright`

```javascript
import { injectAxe, checkA11y } from 'axe-playwright';

test('accessibility', async ({ page }) => {
  await page.goto('https://example.com');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Database Integration

```javascript
import pg from 'pg';

test.beforeAll(async () => {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  // Setup test data
});
```

## API Testing Integration

```javascript
import { request } from '@playwright/test';

test('API + UI test', async ({ page }) => {
  const apiContext = await request.newContext();
  const response = await apiContext.post('/api/login', {
    data: { username: 'test', password: 'pass' }
  });
  const token = await response.json();
  
  // Use token in UI test
  await page.goto('/dashboard', {
    extraHTTPHeaders: { 'Authorization': `Bearer ${token}` }
  });
});
```

## Advanced Retry Logic

```javascript
test.describe.configure({ retries: 3 });

test('flaky test', async ({ page }) => {
  await test.step('Step 1', async () => {
    // This step will retry
  });
});
```

## Custom Fixtures

```javascript
import { test as base } from '@playwright/test';

const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await use(page);
  }
});

export { test };
```
