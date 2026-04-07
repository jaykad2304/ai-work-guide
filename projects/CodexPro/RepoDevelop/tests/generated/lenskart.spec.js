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
 * Generated on: 2026-04-03T18:59:05.220Z
 */

test('Lenskart Home Page Loads', async ({ page }) => {
  await page.goto('https://www.lenskart.com');
  await expectTextVisible(page, "Top Categories");
});

test('Lenskart Search For glasses', async ({ page }) => {
  await page.goto('https://www.lenskart.com');
  await fillByDescription(page, "search field", "glasses");
  await page.keyboard.press("Enter");
  await expect(await expectVisibleByDescription(page, "search results are displayed")).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(page).toHaveURL(/glasses/);
});

