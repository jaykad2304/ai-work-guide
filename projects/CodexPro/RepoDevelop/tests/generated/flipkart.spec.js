import { test, expect } from '@playwright/test';
import {
  expectTextVisible,
  expectVisibleByDescription,
  fillByDescription,
  clickByDescription,
  hoverByDescription,
} from '../../src/utils/locatorHelper.js';

/**
 * Auto-generated test file
 * Generated on: 2026-04-03
 */

// Close Flipkart login popup — waits up to 5s for it to appear
async function closeLoginPopup(page) {
  const closeBtn = page.getByRole('button', { name: '✕' });
  try {
    await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
    await closeBtn.click();
  } catch {
    // popup did not appear — continue
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.flipkart.com');
  await closeLoginPopup(page);
});

test('Flipkart Home Page Loads', async ({ page }) => {
  await expectTextVisible(page, "Flipkart");
  await expect(await expectVisibleByDescription(page, "search bar")).toBeVisible();
});

test('Flipkart Search For Laptops', async ({ page }) => {
  await fillByDescription(page, "search bar", "laptops");
  await clickByDescription(page, "search button");
  await expect(await expectVisibleByDescription(page, "search results")).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/laptops/);
});

test('Flipkart Search And Hover Product', async ({ page }) => {
  await fillByDescription(page, "search bar", "headphones");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2000);
  await hoverByDescription(page, "first product card");
  await expect(await expectVisibleByDescription(page, "product title")).toBeVisible();
});

test('Flipkart Filter By Brand', async ({ page }) => {
  await fillByDescription(page, "search bar", "mobile phones");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
  await expectTextVisible(page, "Brand");
  await clickByDescription(page, "Samsung filter");
});

test('Flipkart Open Login Page', async ({ page }) => {
  await clickByDescription(page, "login button");
  await expectTextVisible(page, "Login");
  await expect(await expectVisibleByDescription(page, "mobile number")).toBeVisible();
});
