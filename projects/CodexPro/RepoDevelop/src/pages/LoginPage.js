/**
 * Login Page Object
 * Example page object for login functionality
 */

import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.selectors = {
      usernameInput: 'input[name="username"], input[type="email"]',
      passwordInput: 'input[name="password"], input[type="password"]',
      loginButton: 'button:has-text("Login"), button[type="submit"]',
      errorMessage: '.error-message, .alert-error',
      successMessage: '.success-message, .alert-success'
    };
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(url = '/login') {
    await this.goto(url);
  }

  /**
   * Login with credentials
   */
  async login(username, password) {
    await this.fill(this.selectors.usernameInput, username);
    await this.fill(this.selectors.passwordInput, password);
    await this.click(this.selectors.loginButton);
  }

  /**
   * Check if error message is displayed
   */
  async getErrorMessage() {
    return await this.getText(this.selectors.errorMessage);
  }

  /**
   * Check if login was successful
   */
  async isLoggedIn() {
    // This would check for user-specific elements after login
    return await this.isVisible('.user-dashboard, .user-profile');
  }
}

export default LoginPage;
