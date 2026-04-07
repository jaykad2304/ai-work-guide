# 📖 Complete Tutorial: From Manual to Automated

This tutorial walks you through converting manual test cases to automated tests.

## Example Scenario: Testing a Login Page

### Step 1: Write Manual Test Case

Create `manual-test-cases/login-test.txt`:

```
Test Case: Successful Login Flow
1. Navigate to https://myapp.com/login
2. Enter username "admin@example.com"
3. Enter password "Admin123!"
4. Click login button
5. Verify dashboard page is displayed
6. Verify welcome message "Welcome back, Admin" is shown

Test Case: Invalid Login Attempt
1. Navigate to https://myapp.com/login
2. Enter username "wrong@example.com"
3. Enter password "wrongpass"
4. Click login button
5. Verify error message "Invalid credentials" is displayed
6. Verify user stays on login page
```

### Step 2: Generate Automated Test

```bash
npm run generate:tests -- manual-test-cases/login-test.txt
```

**Output:** `tests/generated/login-test.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test('Successful Login Flow', async ({ page }) => {
  await page.goto('https://myapp.com/login');
  await page.fill('input[name="username"], input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button:has-text("login")');
  await expect(page.locator('text=dashboard page')).toBeVisible();
  await expect(page.locator('text=Welcome back, Admin')).toBeVisible();
});

test('Invalid Login Attempt', async ({ page }) => {
  await page.goto('https://myapp.com/login');
  await page.fill('input[name="username"], input[type="email"]', 'wrong@example.com');
  await page.fill('input[type="password"]', 'wrongpass');
  await page.click('button:has-text("login")');
  await expect(page.locator('text=Invalid credentials')).toBeVisible();
  // Verify user stays on login page
});
```

### Step 3: Refine Generated Test (Optional)

You can manually adjust selectors for better reliability:

```javascript
test('Successful Login Flow', async ({ page }) => {
  await page.goto('https://myapp.com/login');
  
  // Using more specific selectors
  await page.fill('[data-testid="username-input"]', 'admin@example.com');
  await page.fill('[data-testid="password-input"]', 'Admin123!');
  await page.click('[data-testid="login-button"]');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard');
  
  // More specific assertions
  await expect(page.locator('.welcome-message')).toContainText('Welcome back, Admin');
});
```

### Step 4: Run the Test

```bash
# Run in headless mode
npm test

# Run with visible browser
npm run test:headed

# Debug mode
npm run test:debug
```

### Step 5: View Results

```bash
# Playwright HTML report
npm run report:html

# Allure report
npm run report
```

## Advanced Example: E-commerce Flow

### Manual Test Case

```
Test Case: Complete Purchase Flow
1. Navigate to https://shop.com
2. Click on "Electronics" category
3. Click on first product in results
4. Verify product price is displayed
5. Click "Add to Cart" button
6. Verify cart badge shows "1"
7. Click cart icon
8. Click "Checkout" button
9. Enter email "buyer@test.com"
10. Enter shipping address "123 Test St"
11. Enter city "TestCity"
12. Select "California" from state dropdown
13. Enter zip "90210"
14. Click "Continue" button
15. Enter card number "4242424242424242"
16. Enter expiry "12/25"
17. Enter CVV "123"
18. Click "Place Order" button
19. Wait for confirmation
20. Verify order number is displayed
21. Verify success message contains "Thank you"
```

### Generated Test (with manual refinements)

```javascript
import { test, expect } from '@playwright/test';

test('Complete Purchase Flow', async ({ page }) => {
  // Navigate and select product
  await page.goto('https://shop.com');
  await page.click('text=Electronics');
  await page.click('.product-card:first-child');
  
  // Verify and add to cart
  await expect(page.locator('.product-price')).toBeVisible();
  await page.click('button:has-text("Add to Cart")');
  
  // Verify cart updated
  await expect(page.locator('.cart-badge')).toHaveText('1');
  
  // Proceed to checkout
  await page.click('.cart-icon');
  await page.click('button:has-text("Checkout")');
  
  // Fill shipping info
  await page.fill('[name="email"]', 'buyer@test.com');
  await page.fill('[name="address"]', '123 Test St');
  await page.fill('[name="city"]', 'TestCity');
  await page.selectOption('[name="state"]', 'California');
  await page.fill('[name="zip"]', '90210');
  await page.click('button:has-text("Continue")');
  
  // Fill payment info
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.fill('[name="expiry"]', '12/25');
  await page.fill('[name="cvv"]', '123');
  
  // Place order
  await page.click('button:has-text("Place Order")');
  
  // Wait and verify confirmation
  await page.waitForSelector('.order-number');
  await expect(page.locator('.order-number')).toBeVisible();
  await expect(page.locator('.success-message')).toContainText('Thank you');
});
```

## Best Practices

### 1. Write Clear Manual Test Cases
✅ **Good:**
```
Test Case: Login Test
1. Navigate to https://example.com/login
2. Enter username "test@example.com"
3. Enter password "Test123!"
4. Click "Sign In" button
5. Verify dashboard is displayed
```

❌ **Poor:**
```
Test Case: Login
1. Go to the site
2. Login with credentials
3. Check if it works
```

### 2. Use Specific Element Descriptions
✅ **Good:** "Click 'Submit Order' button"
❌ **Poor:** "Click the button"

### 3. Include Test Data
✅ **Good:** "Enter username 'admin@test.com'"
❌ **Poor:** "Enter username"

### 4. Separate Concerns
✅ One test case per user flow
❌ Don't combine unrelated tests

### 5. Add Verification Steps
✅ Include "Verify..." steps
❌ Don't just perform actions

## Troubleshooting Common Issues

### Issue: Generated test can't find element

**Solution:** Refine the selector in generated test:

```javascript
// Generated (might fail)
await page.click('button:has-text("Login")');

// Refined (more reliable)
await page.click('[data-testid="login-button"]');
// or
await page.click('button[type="submit"]');
```

### Issue: Test times out waiting for element

**Solution:** Add explicit waits:

```javascript
await page.waitForSelector('.results', { timeout: 10000 });
await expect(page.locator('.results')).toBeVisible();
```

### Issue: Flaky test due to race conditions

**Solution:** Use proper wait strategies:

```javascript
// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Wait for specific API call
await page.waitForResponse(resp => 
  resp.url().includes('/api/data') && resp.status() === 200
);
```

## Next Steps

1. **Organize with Page Objects**: Move selectors and actions to page object classes
2. **Add Custom Assertions**: Create reusable verification helpers
3. **Configure CI/CD**: Integrate into your pipeline
4. **Enable AI Parsing**: Set OPENAI_API_KEY for GPT-5.4 parsing
5. **Add More Tests**: Expand coverage systematically

---

**You're now ready to automate your test cases! 🚀**
