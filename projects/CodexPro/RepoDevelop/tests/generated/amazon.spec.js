import { test, expect } from '@playwright/test';
import {
  clearByDescription,
  clickByDescription,
  dblclickByDescription,
  expectTextVisible,
  expectVisibleByDescription,
  fillByDescription,
  hoverByDescription,
  rightClickByDescription,
  selectByDescription,
  setInputFilesByDescription,
  waitForByDescription,
} from '../../src/utils/locatorHelper.js';

/**
 * Auto-generated test file
 * Generated on: 2026-04-03T11:17:13.191Z
 */

test('Amazon Home Page Loads', async ({ page }) => {
  await page.goto('https://www.amazon.in');
  await expectTextVisible(page, "Amazon");
  // Verify: Verify search field is displayed
});

test('Amazon Search For Laptop', async ({ page }) => {
  await page.goto('https://www.amazon.in');
  await fillByDescription(page, "search field", "laptop");
  await clickByDescription(page, "search button");
  // Verify: Verify search results are displayed
  await expectTextVisible(page, "laptop");
});

test('Amazon Search For Headphones', async ({ page }) => {
  await page.goto('https://www.amazon.in');
  await fillByDescription(page, "search field", "headphones");
  await clickByDescription(page, "search button");
  // Verify: Verify search results are displayed
  await expectTextVisible(page, "headphones");
});

test('Amazon Search In Books Category', async ({ page }) => {
  await page.goto('https://www.amazon.in');
  await selectByDescription(page, "search dropdown", "Books");
  await fillByDescription(page, "search field", "harry potter");
  await clickByDescription(page, "search button");
  // Verify: Verify search results are displayed
});

test('Amazon Open Sign In', async ({ page }) => {
  await page.goto('https://www.amazon.in');
  await clickByDescription(page, "sign in link");
  await expectTextVisible(page, "Sign in");
});

