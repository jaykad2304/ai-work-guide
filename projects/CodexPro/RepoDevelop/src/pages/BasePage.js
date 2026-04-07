/**
 * Base Page Object Model
 * Provides common functionality for all page objects
 */

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a URL
   */
  async goto(url) {
    await this.page.goto(url);
  }

  /**
   * Click an element
   */
  async click(selector) {
    await this.page.click(selector);
  }

  /**
   * Fill input field
   */
  async fill(selector, value) {
    await this.page.fill(selector, value);
  }

  /**
   * Get element text
   */
  async getText(selector) {
    return await this.page.textContent(selector);
  }

  /**
   * Wait for element
   */
  async waitForElement(selector, options = {}) {
    await this.page.waitForSelector(selector, options);
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector) {
    return await this.page.isVisible(selector);
  }

  /**
   * Take screenshot
   */
  async screenshot(filename) {
    await this.page.screenshot({ path: filename });
  }

  /**
   * Get current URL
   */
  async getUrl() {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getTitle() {
    return await this.page.title();
  }
}

export default BasePage;
