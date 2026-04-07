/**
 * Test Utilities
 * Common helper functions for tests
 */

import { expect } from '@playwright/test';

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Best-effort dismissal for common blocking popups/modals.
 * Safe to call even when no popup exists.
 */
export async function dismissStartupPopups(page) {
  const closeSelectors = [
    '[aria-label="Close"]',
    '[aria-label="close"]',
    '[aria-label*="close" i]',
    '[aria-label*="dismiss" i]',
    'button[aria-label*="close" i]',
    'button[aria-label*="dismiss" i]',
    'button:has-text("×")',
    'button:has-text("✕")',
    'button:has-text("✖")',
    'button.close',
    '.close',
    '.modal-close',
    '.popup-close',
    '.close-btn',
    '.close-button',
    '[data-testid*="close" i]',
    '[class*="close" i]',
  ];

  for (const selector of closeSelectors) {
    try {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 750 })) {
        await locator.click({ timeout: 1500 });
        await page.waitForTimeout(300);
        return true;
      }
    } catch {
      // ignore and keep trying
    }
  }

  const roleNames = [/^close$/i, /^dismiss$/i, /^skip$/i, /^not now$/i, /^no thanks$/i, /^later$/i, /^x$/i];
  for (const name of roleNames) {
    try {
      const locator = page.getByRole('button', { name }).first();
      if (await locator.isVisible({ timeout: 750 })) {
        await locator.click({ timeout: 1500 });
        await page.waitForTimeout(300);
        return true;
      }
    } catch {
      // ignore and keep trying
    }
  }

  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch {
    // ignore
  }

  return false;
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshots/${name}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  return filename;
}

/**
 * Retry an action with exponential backoff
 */
export async function retry(action, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test${timestamp}@example.com`,
    username: `user${timestamp}`,
    password: `Pass${timestamp}!`,
    firstName: `First${timestamp}`,
    lastName: `Last${timestamp}`,
  };
}

/**
 * Verify element visibility
 */
export async function verifyElementVisible(page, selector, timeout = 5000) {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Verify text content
 */
export async function verifyText(page, selector, expectedText) {
  await expect(page.locator(selector)).toContainText(expectedText);
}

/**
 * Verify URL pattern
 */
export async function verifyUrlPattern(page, pattern) {
  await expect(page).toHaveURL(new RegExp(pattern));
}

/**
 * Clear browser storage
 */
export async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Set local storage value
 */
export async function setLocalStorage(page, key, value) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key, value }
  );
}

/**
 * Get local storage value
 */
export async function getLocalStorage(page, key) {
  return await page.evaluate(
    (key) => localStorage.getItem(key),
    key
  );
}

/**
 * Scroll to element
 */
export async function scrollToElement(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page, urlPattern, method = 'GET') {
  return await page.waitForResponse(
    response => response.url().includes(urlPattern) && response.request().method() === method
  );
}

/**
 * Mock API response
 */
export async function mockApiResponse(page, url, responseData) {
  await page.route(url, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseData)
    });
  });
}

export default {
  waitForPageLoad,
  dismissStartupPopups,
  takeScreenshot,
  retry,
  generateTestData,
  verifyElementVisible,
  verifyText,
  verifyUrlPattern,
  clearStorage,
  setLocalStorage,
  getLocalStorage,
  scrollToElement,
  waitForApiResponse,
  mockApiResponse
};
