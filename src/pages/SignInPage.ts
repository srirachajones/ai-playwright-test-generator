import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SignInPage extends BasePage {
  // Form locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;

  // Error message locators
  readonly errorMessage: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly generalError: Locator;

  // Navigation locators
  readonly signUpLink: Locator;
  readonly backToHomeLink: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page, 'https://www.experian.com/login');
    
    // Form elements
    this.emailInput = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email"]');; // Enhanced: Email input field (confidence: 95%)
    this.passwordInput = page.locator('input[type="password"], input[name*="password"], input[placeholder*="password"]');; // Enhanced: Password input field (confidence: 95%)
    this.signInButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")'); // Enhanced: Sign in submit button (confidence: 90%), button:has-text("Log In"), [data-testid="sign-in-button"]');
    this.rememberMeCheckbox = page.locator('input[type="checkbox"][name*="remember"], input[type="checkbox"] + label:has-text("Remember"), [data-testid="remember-me"]');; // Enhanced: Remember me checkbox (confidence: 70%)
    this.forgotPasswordLink = page.locator('a:has-text("Forgot Password"), a:has-text("Reset Password"), a[href*="forgot"]'); // Enhanced: Forgot password link (confidence: 80%), a:has-text("Reset Password"), [data-testid="forgot-password"]');

    // Error messages
    this.errorMessage = page.locator('.error-message, .alert-danger, .error, [data-testid="error-message"]');; // Enhanced: Error message display (confidence: 80%)
    this.emailError = page.locator('.email-error, [data-testid="email-error"], .field-error:near(input[type="email"])');
    this.passwordError = page.locator('.password-error, [data-testid="password-error"], .field-error:near(input[type="password"])');
    this.generalError = page.locator('.general-error, .login-error, [data-testid="general-error"]');

    // Navigation
    this.signUpLink = page.locator('a[href*="signup"], a[href*="register"], text="Sign Up", text="Register"'); // Enhanced: Main sign-up navigation link (confidence: 90%), a:has-text("Register"), a[href*="signup"], [data-testid="sign-up-link"]');
    this.backToHomeLink = page.locator('a:has-text("Home"), .back-to-home, [data-testid="home-link"]');

    // Loading states
    this.loadingSpinner = page.locator('.loading, .spinner, [data-testid="loading"]');
    this.submitButton = this.signInButton;
  }

  /**
   * Sign in with credentials
   */
  async signIn(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.waitForElement(this.emailInput);
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.waitForElement(this.passwordInput);
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }

  /**
   * Click sign in button
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  /**
   * Click remember me checkbox
   */
  async toggleRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.check();
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  /**
   * Navigate to sign up page
   */
  async navigateToSignUp(): Promise<void> {
    await this.signUpLink.click();
  }

  /**
   * Wait for sign in to complete (redirect or success indicator)
   */
  async waitForSignInComplete(): Promise<void> {
    // Wait for either redirect away from login page or success indicator
    try {
      await this.page.waitForURL('**/dashboard**', { timeout: 10000 });
    } catch {
      // If no redirect, wait for loading to complete
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Check if there are validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    return await this.isElementVisible(this.errorMessage) ||
           await this.isElementVisible(this.emailError) ||
           await this.isElementVisible(this.passwordError);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.isElementVisible(this.errorMessage)) {
      return await this.errorMessage.textContent() || '';
    }
    if (await this.isElementVisible(this.generalError)) {
      return await this.generalError.textContent() || '';
    }
    return '';
  }

  /**
   * Verify sign in page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await this.waitForElement(this.emailInput);
    await this.waitForElement(this.passwordInput);
    await this.waitForElement(this.signInButton);
  }

  /**
   * Verify sign in failed (error message is shown)
   */
  async verifySignInFailed(): Promise<void> {
    await expect(this.errorMessage.or(this.generalError)).toBeVisible();
  }

  /**
   * Verify specific error message
   */
  async verifyErrorMessage(expectedMessage: string): Promise<void> {
    const errorText = await this.getErrorMessage();
    expect(errorText.toLowerCase()).toContain(expectedMessage.toLowerCase());
  }
}
